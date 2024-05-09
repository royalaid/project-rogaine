// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "./IRouter.sol";
import "./IERC20.sol";
import "./IGauge.sol";

contract AeroBondTest {
    address public manager;
    address public treasury;

    IERC20 public LP_TOKEN; // REGEN/WETH
    IERC20 public AERO = IERC20(0x940181a94A35A4569E4529A3CDfB74e38FD98631); // AERO
    IRouter public router = IRouter(0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43); // Router
    IERC20 public TOKEN; // REGEN
    IERC20 public WETH; // WETH

    IGauge public tokenGauge;
    bool public tokenGaugeEnabled;

    error OnlyManagement();

    modifier onlyManager() {
        if(msg.sender != manager) {
            revert OnlyManagement();
        }
        _;
    }

    constructor(
        address treasury_,
        address manager_,
        address lpTokenAddress,
        address tokenAddress,
        address wethAddress
    )
    {   
        // receives the rewards
        treasury = treasury_;
        // manages the liquidity
        manager = manager_;
        // set LP token address
        LP_TOKEN = IERC20(lpTokenAddress);
        // set TOKEN address
        TOKEN = IERC20(tokenAddress);
        // set WETH address
        WETH = IERC20(wethAddress);
    }

    function claimAeroRewards() external {
        tokenGauge.getReward(address(this));
        AERO.transfer(treasury, AERO.balanceOf(address(this)));
    }

    function initializeGauge(address tokenGauge_) onlyManager external {
        tokenGaugeEnabled = true;
        tokenGauge = IGauge(tokenGauge_);
    }

    function disableGauge() onlyManager external {
        tokenGaugeEnabled=false;
    }

    function changeTreasury(address newTreasury_) onlyManager external {
        treasury = newTreasury_;
    }

    function transferTokens(address token) onlyManager external {
        IERC20(token).transfer(treasury, IERC20(token).balanceOf(address(this)));
    }

    function deposit(uint wethAmount) public {
        WETH.transferFrom(msg.sender, address(this), wethAmount);

        WETH.approve(address(router), wethAmount);

        uint256 tokenHeld = TOKEN.balanceOf(address(this));
        TOKEN.approve(address(router), tokenHeld);

        (uint tokenSpent, uint wethSpent, uint lpTokensReceived) = router.addLiquidity(address(TOKEN), address(WETH), false, tokenHeld, wethAmount, 0, 0, address(this), block.timestamp);
        require(lpTokensReceived > 0, "No LP tokens received");

        WETH.transfer(msg.sender, (wethAmount-wethSpent));
        TOKEN.transfer(msg.sender, tokenSpent);

        if(tokenGaugeEnabled){
            tokenGauge.deposit(LP_TOKEN.balanceOf(address(this)));
        }
    }

    function withdrawLiquidity() public onlyManager returns (uint256, uint256) {

        uint ownedLiquidity = tokenGauge.balanceOf(address(this));

        tokenGauge.withdraw(ownedLiquidity);

        LP_TOKEN.approve(address(router), ownedLiquidity);
        (uint256 amountWETH, uint256 amountToken) = router.removeLiquidity(
                                                                        address(WETH), 
                                                                        address(TOKEN), 
                                                                        false, 
                                                                        ownedLiquidity, 
                                                                        0, 
                                                                        0, 
                                                                        address(this),
                                                                        block.timestamp
                                                                        );
        return (amountWETH, amountToken);
    }
}