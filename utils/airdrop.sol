// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Simple Airdrop Contract for ERC20 tokens
/// @author Copilot
interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Airdrop {
    address public owner;

    event Airdropped(address indexed token, address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /// @notice 批量空投不同数量的代币
    /// @param token ERC20合约地址
    /// @param recipients 接收者地址数组
    /// @param amounts 每个接收者对应空投数量
    function airdrop(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(token != address(0), "Zero token address");
        require(recipients.length == amounts.length, "Length mismatch");

        for (uint256 i = 0; i < recipients.length; i++) {
            require(IERC20(token).transfer(recipients[i], amounts[i]), "Transfer failed");
            emit Airdropped(token, recipients[i], amounts[i]);
        }
    }

    /// @notice 查询合约内的ERC20余额
    function contractBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice 提取合约内的ERC20余额（仅owner）
    function withdraw(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner, amount), "Withdraw failed");
    }

    /// @notice 转移合约所有权
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}