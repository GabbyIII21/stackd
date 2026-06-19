// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {StackdRegistry} from "../src/StackdRegistry.sol";

/// @notice Deploys StackdRegistry. Broadcasts with the key in PRIVATE_KEY.
/// @dev    forge script script/Deploy.s.sol:Deploy \
///           --rpc-url base_sepolia --broadcast --verify
contract Deploy is Script {
    function run() external returns (StackdRegistry registry) {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        registry = new StackdRegistry();
        vm.stopBroadcast();
        console.log("StackdRegistry deployed at:", address(registry));
    }
}
