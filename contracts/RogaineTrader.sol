pragma solidity ^0.8.24;

import "./IAEROTrader.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LiquidityProvider {
    using SafeERC20 for IERC20;

    IAEROTrader public aerotrader;
    address public token;
    address public weth;

    address public owner;

    constructor(address _aerotrader, address _token) {
        aerotrader = IAEROTrader(_aerotrader);
        token = _token;
        weth = aerotrader.weth();
        owner=msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be the zero address");
        owner = newOwner;
    }
    function deposit(uint256 amountWETH, uint256 amountToken) external {
        require(IERC20(weth).balanceOf(msg.sender) >= amountWETH, "Insufficient WETH balance");
        require(IERC20(token).balanceOf(address(this)) >= amountToken, "Insufficient token balance");

        // Transfer WETH and token from msg.sender to this contract
        IERC20(weth).safeTransferFrom(msg.sender, address(this), amountWETH);

        // Approve token and WETH transfer to aerotrader
        IERC20(weth).safeApprove(address(aerotrader), amountWETH);
        IERC20(token).safeApprove(address(aerotrader), amountToken);

        // Add liquidity
        (uint256 amountTokenUsed, uint256 amountWETHUsed, uint256 liquidity) = aerotrader.addLiquidity(
            token,
            weth,
            false, // assuming non-stable pool for simplicity
            amountToken,
            amountWETH,
            amountToken,
            amountWETH,
            msg.sender,
            block.timestamp + 300 // deadline in 5 minutes
        );
    }

    function sweepETH(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).safeTransfer(msg.sender, balance);
    }


