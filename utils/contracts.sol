// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BaseGame {

    event Transfer(address indexed from, address indexed to, uint256 value);

    function transfer(address payable to) public payable {
        require(to != address(0), "Invalid address");
        
        to.transfer(msg.value);
        emit Transfer(msg.sender, to, msg.value);
    }
}