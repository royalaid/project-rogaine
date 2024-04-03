pragma solidity ^0.8.24;

import "./rogaine.sol";

contract AerogaineFactory {
    address[] public deployedRogaines;
    address public aerodromeRouter=0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43;

    event RogaineDeployed(address indexed rogaineAddress, address indexed creator);

    function createRogaine(address _memeCoinAddress) public {
        Rogaine newRogaine = new Rogaine(aerodromeRouter, _memeCoinAddress, msg.sender);
        deployedRogaines.push(address(newRogaine));
        emit RogaineDeployed(address(newRogaine), msg.sender);
    }

    function getDeployedRogaines() public view returns (address[] memory) {
        return deployedRogaines;
    }
}
