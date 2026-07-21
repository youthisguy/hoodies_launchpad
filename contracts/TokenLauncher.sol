// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {VestingWallet} from "@openzeppelin/contracts/finance/VestingWallet.sol";
import {LaunchToken} from "./LaunchToken.sol";
import {TokenLaunchpad} from "./TokenLaunchpad.sol";

interface IParentFactory {
    function HOODIE() external view returns (address);
    function router() external view returns (address);
}

/// @title TokenLauncher
/// @notice A single, reusable token-launcher instance. Deployed as a clone by
///         HoodieLauncherFactory ("the launcher launcher"). Whoever owns a
///         TokenLauncher can call `launch()` as many times as they like to
///         create new HOODIE-paired tokens under their own operator identity,
///         with their own fee revenue and curve defaults — without touching
///         the top-level factory again.
/// @dev HOODIE and the AMM router are never stored locally; both are read
///      live from the parent factory on every call. This means: (a) the
///      pairing asset can never diverge from the top-level immutable HOODIE
///      address no matter what this contract's operator does, and (b) if the
///      top-level owner ever needs to point at a new router (e.g. a Uniswap
///      version upgrade), every launcher and every launch inherits it
///      automatically with no per-launcher migration needed.
contract TokenLauncher {
    address public parentFactory;
    address public launchpadImplementation;
    address public operator;

    address public feeRecipient;
    uint16 public feeBps;
    uint16 public feeBpsCap; // set once at creation from the factory's global cap at that time

    uint16 public maxCreatorAllocationBps;
    uint16 public maxCreatorAllocationBpsCap; // set once at creation from the factory's global cap

    uint64 public creatorVestingDuration;

    struct LaunchDefaults {
        uint128 virtualTokenReserveBuffer;
        uint128 virtualHoodieReserves;
        uint128 migrationThreshold;
    }
    LaunchDefaults public defaults;

    bool public initialized;

    struct LaunchInfo {
        address launchpad;
        address token;
        address vestingWallet;
    }
    LaunchInfo[] public allLaunches;
    mapping(address => LaunchInfo[]) public launchesByCreator;

    event LauncherInitialized(address indexed operator, address indexed parentFactory);
    event Launched(
        address indexed creator,
        address indexed launchpad,
        address indexed token,
        string name,
        string symbol,
        uint256 curveSupply,
        uint256 creatorAllocation,
        address vestingWallet
    );
    event DefaultsUpdated(LaunchDefaults defaults);
    event FeeUpdated(address feeRecipient, uint16 feeBps);
    event CreatorAllocationPolicyUpdated(uint16 maxCreatorAllocationBps, uint64 creatorVestingDuration);
    event OperatorTransferred(address indexed previousOperator, address indexed newOperator);

    modifier onlyOperator() {
        require(msg.sender == operator, "not launcher operator");
        _;
    }

    /// @dev Called exactly once by HoodieLauncherFactory immediately after cloning.
    function initialize(
        address parentFactory_,
        address launchpadImplementation_,
        address operator_,
        address feeRecipient_,
        uint16 feeBps_,
        uint16 feeBpsCap_,
        uint16 maxCreatorAllocationBps_,
        uint16 maxCreatorAllocationBpsCap_,
        uint64 creatorVestingDuration_,
        LaunchDefaults memory defaults_
    ) external {
        require(!initialized, "already initialized");
        require(feeBps_ <= feeBpsCap_, "fee exceeds cap");
        require(maxCreatorAllocationBps_ <= maxCreatorAllocationBpsCap_, "creator allocation exceeds cap");

        initialized = true;
        parentFactory = parentFactory_;
        launchpadImplementation = launchpadImplementation_;
        operator = operator_;
        feeRecipient = feeRecipient_;
        feeBps = feeBps_;
        feeBpsCap = feeBpsCap_;
        maxCreatorAllocationBps = maxCreatorAllocationBps_;
        maxCreatorAllocationBpsCap = maxCreatorAllocationBpsCap_;
        creatorVestingDuration = creatorVestingDuration_;
        defaults = defaults_;

        emit LauncherInitialized(operator_, parentFactory_);
    }

    // -------------------------------------------------------------------
    // Launching — identical mechanics to the single-tier version, now
    // scoped to this operator's own launcher instance.
    // -------------------------------------------------------------------

    function launch(
        string calldata name,
        string calldata symbol,
        uint256 totalSupply,
        uint16 creatorAllocationBps
    ) external returns (address launchpad, address tokenAddr, address vestingWallet) {
        require(totalSupply > 0, "supply must be positive");
        require(totalSupply <= type(uint128).max, "supply too large");
        require(creatorAllocationBps <= maxCreatorAllocationBps, "creator allocation exceeds cap");

        uint256 creatorAllocation = (totalSupply * creatorAllocationBps) / 10_000;
        uint256 curveSupply = totalSupply - creatorAllocation;
        require(curveSupply > 0, "curve supply must be positive");

        launchpad = Clones.clone(launchpadImplementation);

        if (creatorAllocation > 0) {
            vestingWallet = address(
                new VestingWallet(msg.sender, uint64(block.timestamp), creatorVestingDuration)
            );
        }

        LaunchToken newToken = new LaunchToken(
            name,
            symbol,
            curveSupply,
            launchpad,
            creatorAllocation,
            vestingWallet
        );
        tokenAddr = address(newToken);

        LaunchDefaults memory d = defaults;
        TokenLaunchpad(launchpad).initialize(
            tokenAddr,
            IParentFactory(parentFactory).HOODIE(),
            msg.sender,
            uint128(curveSupply) + d.virtualTokenReserveBuffer,
            d.virtualHoodieReserves,
            uint128(curveSupply),
            d.migrationThreshold
        );

        LaunchInfo memory info = LaunchInfo(launchpad, tokenAddr, vestingWallet);
        allLaunches.push(info);
        launchesByCreator[msg.sender].push(info);

        emit Launched(msg.sender, launchpad, tokenAddr, name, symbol, curveSupply, creatorAllocation, vestingWallet);
    }

    // -------------------------------------------------------------------
    // Views consumed by TokenLaunchpad clones deployed through this launcher
    // -------------------------------------------------------------------

    /// @notice Always the top-level factory's HOODIE address. Cannot diverge.
    function HOODIE() external view returns (address) {
        return IParentFactory(parentFactory).HOODIE();
    }

    /// @notice Always the top-level factory's router. Cannot diverge.
    function router() external view returns (address) {
        return IParentFactory(parentFactory).router();
    }

    function totalLaunches() external view returns (uint256) {
        return allLaunches.length;
    }

    function getLaunchesByCreator(address creator) external view returns (LaunchInfo[] memory) {
        return launchesByCreator[creator];
    }

    // -------------------------------------------------------------------
    // Operator controls — bounded by the caps fixed at creation. Operator
    // can never raise fee or creator allocation above what the top-level
    // factory approved when this launcher was created, and has no way to
    // touch HOODIE or the router at all.
    // -------------------------------------------------------------------

    function setDefaults(LaunchDefaults calldata newDefaults) external onlyOperator {
        defaults = newDefaults;
        emit DefaultsUpdated(newDefaults);
    }

    function setFee(address newFeeRecipient, uint16 newFeeBps) external onlyOperator {
        require(newFeeBps <= feeBpsCap, "fee exceeds cap");
        feeRecipient = newFeeRecipient;
        feeBps = newFeeBps;
        emit FeeUpdated(newFeeRecipient, newFeeBps);
    }

    function setCreatorAllocationPolicy(uint16 newMaxBps, uint64 newVestingDuration) external onlyOperator {
        require(newMaxBps <= maxCreatorAllocationBpsCap, "creator allocation exceeds cap");
        maxCreatorAllocationBps = newMaxBps;
        creatorVestingDuration = newVestingDuration;
        emit CreatorAllocationPolicyUpdated(newMaxBps, newVestingDuration);
    }

    function transferOperator(address newOperator) external onlyOperator {
        require(newOperator != address(0), "zero address");
        emit OperatorTransferred(operator, newOperator);
        operator = newOperator;
    }
}
