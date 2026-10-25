// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private storedValue;

    constructor(uint256 initialValue) {
        storedValue = initialValue;
    }

    function getValue() public view returns (uint256) {
        return storedValue;
    }

    function setValue(uint256 newValue) public {
        storedValue = newValue;
    }
}
