// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Fixed-supply ERC20 for tokens created through the launcher.
/// @dev The full `totalSupply` is minted in this constructor, split between
///      exactly two destinations: the bonding-curve launchpad (`curveSupply`)
///      and, optionally, a vesting wallet holding the creator's allocation
///      (`creatorAllocation`). curveSupply + creatorAllocation always equals
///      totalSupply, so no tokens are ever minted to an unused/unreachable
///      address. There is no mint function after construction, so no admin
///      can inflate supply post-launch.
contract LaunchToken is ERC20 {
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 curveSupply,
        address launchpad,
        uint256 creatorAllocation,
        address vestingWallet
    ) ERC20(name_, symbol_) {
        if (curveSupply > 0) {
            _mint(launchpad, curveSupply);
        }
        if (creatorAllocation > 0) {
            require(vestingWallet != address(0), "vesting wallet required");
            _mint(vestingWallet, creatorAllocation);
        }
    }
}
