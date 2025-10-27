// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IBEP20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract AirDrop {
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // 批量空投BEP20 Token
    function airdropTokens(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length == amounts.length, "Array length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            require(IBEP20(token).transfer(recipients[i], amounts[i]), "Transfer failed");
        }
    }

    function airdropToken(address token, address recipient, uint256 amount) external onlyOwner{
        IBEP20(token).transfer(recipient, amount);
    }

    // 提取合约中剩余Token
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        require(IBEP20(token).transfer(owner, amount), "Withdraw failed");
    }

    // 转移合约所有权
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}