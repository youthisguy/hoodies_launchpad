// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IUniswapV2Factory} from "./interfaces/IUniswapV2Factory.sol";
import {IUniswapV2Router02} from "./interfaces/IUniswapV2Router02.sol";
import {LaunchToken} from "./LaunchToken.sol";

interface ILauncherFactory {
    function HOODIE() external view returns (address);
    function router() external view returns (address);
    function feeRecipient() external view returns (address);
    function feeBps() external view returns (uint16);
}

/// @title TokenLaunchpad
/// @notice One bonding-curve sale per deployed clone. Denominated entirely in
///         HOODIE — there is no parameter, admin function, or code path that
///         accepts any other funding asset. On migration, the resulting AMM
///         pool is always TOKEN/HOODIE and its LP tokens are burned, so the
///         pairing requirement holds both during the curve phase and after
///         the token graduates to the open market.
/// @dev Deployed as an EIP-1167 minimal proxy clone by HoodieLauncherFactory.
///      Uses a virtual-reserve constant-product curve (the same mechanism
///      popularized by pump.fun): buys/sells move a constant-product curve
///      seeded with virtual reserves, so price rises smoothly with demand
///      without needing an oracle or off-chain component.
contract TokenLaunchpad is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ----- immutable-by-convention (set once in initialize) -----
    address public factory;
    address public creator;
    LaunchToken public token;
    IERC20 public hoodie;

    uint128 public virtualTokenReserves;
    uint128 public virtualHoodieReserves;
    uint128 public realTokenReserves;
    uint128 public realHoodieReserves;

    /// @notice Real HOODIE raised at which the curve migrates to a Uniswap pool.
    uint128 public migrationThreshold;

    bool public initialized;
    bool public migrated;

    address public pair;

    event Initialized(address indexed token, address indexed hoodie, address creator);
    event Buy(address indexed buyer, uint256 hoodieIn, uint256 tokensOut, uint256 feePaid);
    event Sell(address indexed seller, uint256 tokensIn, uint256 hoodieOut, uint256 feePaid);
    event Migrated(address indexed pair, uint256 tokenLiquidity, uint256 hoodieLiquidity, uint256 lpBurned);

    modifier onlyBeforeMigration() {
        require(!migrated, "launch already migrated to AMM");
        _;
    }

    /// @dev Called exactly once by the factory immediately after cloning.
    function initialize(
        address token_,
        address hoodie_,
        address creator_,
        uint128 virtualTokenReserves_,
        uint128 virtualHoodieReserves_,
        uint128 realTokenReserves_,
        uint128 migrationThreshold_
    ) external {
        require(!initialized, "already initialized");
        require(token_ != address(0) && hoodie_ != address(0), "zero address");
        require(migrationThreshold_ > 0, "threshold must be positive");

        initialized = true;
        factory = msg.sender;
        creator = creator_;
        token = LaunchToken(token_);
        hoodie = IERC20(hoodie_);

        virtualTokenReserves = virtualTokenReserves_;
        virtualHoodieReserves = virtualHoodieReserves_;
        realTokenReserves = realTokenReserves_;
        migrationThreshold = migrationThreshold_;

        emit Initialized(token_, hoodie_, creator_);
    }

    // -------------------------------------------------------------------
    // Curve trading
    // -------------------------------------------------------------------

    /// @notice Buy project tokens with HOODIE along the bonding curve.
    /// @param hoodieIn Amount of HOODIE to spend.
    /// @param minTokensOut Slippage guard.
    function buy(uint256 hoodieIn, uint256 minTokensOut) external nonReentrant onlyBeforeMigration {
        require(hoodieIn > 0, "amount must be positive");

        (uint256 fee, uint256 netIn) = _takeFee(hoodieIn);

        hoodie.safeTransferFrom(msg.sender, address(this), hoodieIn);
        if (fee > 0) {
            hoodie.safeTransfer(ILauncherFactory(factory).feeRecipient(), fee);
        }

        uint256 k = uint256(virtualTokenReserves) * uint256(virtualHoodieReserves);
        uint256 newVirtualHoodie = uint256(virtualHoodieReserves) + netIn;
        uint256 newVirtualToken = k / newVirtualHoodie;
        uint256 tokensOut = uint256(virtualTokenReserves) - newVirtualToken;

        require(tokensOut >= minTokensOut, "slippage: tokens out too low");
        require(tokensOut <= realTokenReserves, "exceeds remaining curve supply");

        virtualHoodieReserves = uint128(newVirtualHoodie);
        virtualTokenReserves = uint128(newVirtualToken);
        realHoodieReserves += uint128(netIn);
        realTokenReserves -= uint128(tokensOut);

        token.transfer(msg.sender, tokensOut);

        emit Buy(msg.sender, hoodieIn, tokensOut, fee);

        if (realHoodieReserves >= migrationThreshold) {
            _migrate();
        }
    }

    /// @notice Sell project tokens back into the curve for HOODIE (pre-migration only).
    function sell(uint256 tokensIn, uint256 minHoodieOut) external nonReentrant onlyBeforeMigration {
        require(tokensIn > 0, "amount must be positive");

        uint256 k = uint256(virtualTokenReserves) * uint256(virtualHoodieReserves);
        uint256 newVirtualToken = uint256(virtualTokenReserves) + tokensIn;
        uint256 newVirtualHoodie = k / newVirtualToken;
        uint256 grossOut = uint256(virtualHoodieReserves) - newVirtualHoodie;
        require(grossOut <= realHoodieReserves, "insufficient curve liquidity");

        (uint256 fee, uint256 netOut) = _takeFee(grossOut);
        require(netOut >= minHoodieOut, "slippage: hoodie out too low");

        virtualTokenReserves = uint128(newVirtualToken);
        virtualHoodieReserves = uint128(newVirtualHoodie);
        realTokenReserves += uint128(tokensIn);
        realHoodieReserves -= uint128(grossOut);

        token.transferFrom(msg.sender, address(this), tokensIn);
        hoodie.safeTransfer(msg.sender, netOut);
        if (fee > 0) {
            hoodie.safeTransfer(ILauncherFactory(factory).feeRecipient(), fee);
        }

        emit Sell(msg.sender, tokensIn, netOut, fee);
    }

    function _takeFee(uint256 amount) internal view returns (uint256 fee, uint256 net) {
        uint16 bps = ILauncherFactory(factory).feeBps();
        fee = (amount * bps) / 10_000;
        net = amount - fee;
    }

    // -------------------------------------------------------------------
    // Migration: always TOKEN/HOODIE, always burned LP
    // -------------------------------------------------------------------

    function _migrate() internal {
        migrated = true;

        address routerAddr = ILauncherFactory(factory).router();
        IUniswapV2Router02 router = IUniswapV2Router02(routerAddr);
        IUniswapV2Factory uniFactory = IUniswapV2Factory(router.factory());

        address existingPair = uniFactory.getPair(address(token), address(hoodie));
        pair = existingPair == address(0)
            ? uniFactory.createPair(address(token), address(hoodie))
            : existingPair;

        uint256 tokenLiquidity = token.balanceOf(address(this));
        uint256 hoodieLiquidity = hoodie.balanceOf(address(this));

        token.approve(routerAddr, tokenLiquidity);
        hoodie.approve(routerAddr, hoodieLiquidity);

        (, , uint256 lpMinted) = router.addLiquidity(
            address(token),
            address(hoodie),
            tokenLiquidity,
            hoodieLiquidity,
            0,
            0,
            address(0x000000000000000000000000000000000000dEaD), // LP sent straight to burn address: liquidity is permanently locked
            block.timestamp
        );

        emit Migrated(pair, tokenLiquidity, hoodieLiquidity, lpMinted);
    }

    // -------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------

    /// @notice Current spot price: HOODIE per whole token (18-decimal fixed point).
    function currentPrice() external view returns (uint256) {
        if (virtualTokenReserves == 0) return 0;
        return (uint256(virtualHoodieReserves) * 1e18) / uint256(virtualTokenReserves);
    }

    function isMigrated() external view returns (bool) {
        return migrated;
    }
}
