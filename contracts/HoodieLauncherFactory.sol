// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {TokenLaunchpad} from "./TokenLaunchpad.sol";
import {TokenLauncher} from "./TokenLauncher.sol";

/// @title HoodieLauncherFactory
/// @notice The "token launcher launcher." Deploys new TokenLauncher instances
///         each one is a fully independent, reusable
///         launchpad that its operator can use to launch as many HOODIE-paired
///         tokens as they want, with their own fee revenue and curve settings.
///
///         HOODIE is `immutable`.  Every TokenLauncher
///         reads it live from this contract on every launch. There is no
///         way to create a token that pairs with anything else.
contract HoodieLauncherFactory is Ownable {
    /// @notice funding/pairing asset.
    address public immutable HOODIE;

    /// @notice TokenLaunchpad implementation every launch (via any launcher) clones.
    address public immutable launchpadImplementation;

    /// @notice TokenLauncher implementation every `createLauncher()` call clones.
    address public immutable launcherImplementation;

    /// @notice Uniswap V2-compatible router used for migration liquidity across
    ///         every launcher. Deliberately kept here, not delegated to
    ///         launcher operators - a malicious or careless router swap is how
    ///         migration liquidity gets stolen, so only this contract's owner
    ///         controls it, and every launcher/launch reads it live.
    address public router;

    /// @notice Hard ceiling on the trading fee any launcher may charge, in basis points.
    uint16 public globalMaxFeeBps;

    /// @notice Hard ceiling on the creator allocation any launcher may permit, in basis points.
    uint16 public globalMaxCreatorAllocationBps;

    address[] public allLaunchers;
    mapping(address => address[]) public launchersByOperator;

    event LauncherCreated(address indexed operator, address indexed launcher);
    event RouterUpdated(address router);
    event GlobalCapsUpdated(
        uint16 globalMaxFeeBps,
        uint16 globalMaxCreatorAllocationBps
    );

    constructor(
        address hoodie_,
        address router_,
        uint16 globalMaxFeeBps_,
        uint16 globalMaxCreatorAllocationBps_,
        address initialOwner
    ) Ownable(initialOwner) {
        require(hoodie_ != address(0), "HOODIE address required");
        require(router_ != address(0), "router address required");
        require(globalMaxFeeBps_ <= 1000, "fee cap too high"); // hard cap 10%
        require(globalMaxCreatorAllocationBps_ <= 5000, "creator cap too high"); // hard cap 50%

        HOODIE = hoodie_;
        router = router_;
        globalMaxFeeBps = globalMaxFeeBps_;
        globalMaxCreatorAllocationBps = globalMaxCreatorAllocationBps_;

        launchpadImplementation = address(new TokenLaunchpad());
        launcherImplementation = address(new TokenLauncher());
    }

    /// @notice Deploy a new, independent token launcher. The caller becomes
    ///         its operator and can launch tokens through it immediately,
    ///         set its fee revenue (within the global cap), and tune its
    ///         bonding-curve defaults - all without any further involvement
    ///         from this factory or its owner.
    function createLauncher(
        address feeRecipient,
        uint16 feeBps,
        uint16 maxCreatorAllocationBps,
        uint64 creatorVestingDuration,
        TokenLauncher.LaunchDefaults calldata defaults
    ) external returns (address launcher) {
        require(feeBps <= globalMaxFeeBps, "fee exceeds global cap");
        require(
            maxCreatorAllocationBps <= globalMaxCreatorAllocationBps,
            "creator allocation exceeds global cap"
        );

        launcher = Clones.clone(launcherImplementation);

        TokenLauncher(launcher).initialize(
            address(this),
            launchpadImplementation,
            msg.sender,
            feeRecipient,
            feeBps,
            globalMaxFeeBps,
            maxCreatorAllocationBps,
            globalMaxCreatorAllocationBps,
            creatorVestingDuration,
            defaults
        );

        allLaunchers.push(launcher);
        launchersByOperator[msg.sender].push(launcher);

        emit LauncherCreated(msg.sender, launcher);
    }

    // -------------------------------------------------------------------
    // Views
    // -------------------------------------------------------------------

    function totalLaunchers() external view returns (uint256) {
        return allLaunchers.length;
    }

    function getLaunchersByOperator(
        address operator
    ) external view returns (address[] memory) {
        return launchersByOperator[operator];
    }

    // -------------------------------------------------------------------
    // Owner controls - cannot touch HOODIE, cannot reach
    // into already-deployed launchers' fee/defaults state, only the shared
    // router and the global caps future/existing launchers are bounded by.
    // Note: lowering globalMaxFeeBps or globalMaxCreatorAllocationBps below
    // an existing launcher's current values does NOT retroactively reduce
    // that launcher's settings - it only blocks that launcher's operator
    // from raising them further and blocks new launchers from exceeding it.
    // -------------------------------------------------------------------

    function setRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "zero address");
        router = newRouter;
        emit RouterUpdated(newRouter);
    }

    function setGlobalCaps(
        uint16 newMaxFeeBps,
        uint16 newMaxCreatorAllocationBps
    ) external onlyOwner {
        require(newMaxFeeBps <= 1000, "fee cap too high");
        require(newMaxCreatorAllocationBps <= 5000, "creator cap too high");
        globalMaxFeeBps = newMaxFeeBps;
        globalMaxCreatorAllocationBps = newMaxCreatorAllocationBps;
        emit GlobalCapsUpdated(newMaxFeeBps, newMaxCreatorAllocationBps);
    }
}
