pragma solidity ^0.8.24;

import "./rogaine.sol";

contract RogaineFactory {
    address[] public deployedRogaines;

    event RogaineDeployed(address indexed rogaineAddress, address indexed creator);

    function createRogaine(address _aerodromeRouter, address _memeCoinAddress) public {
        Rogaine newRogaine = new Rogaine(_aerodromeRouter, _memeCoinAddress);
        deployedRogaines.push(address(newRogaine));
        emit RogaineDeployed(address(newRogaine), msg.sender);
    }

    function getDeployedRogaines() public view returns (address[] memory) {
        return deployedRogaines;
    }
}
