// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "./IRouter.sol";
import "./IERC20.sol";
import "./IGauge.sol";

/*
    Most of this contract assumes the paired liquidity is is pegged. so both tokens are worth the "same"
*/

contract AeroCaptain {
    address public manager;
    address public treasury;
    address public guardian;

    uint public maxSlippageBpsTokenToUsdc;
    uint public maxSlippageBpsUsdcToToken;
    uint public maxSlippageBpsLiquidity;

    uint public constant TOKEN_USDC_CONVERSION_MULTI = 1e12; // only works for 18 to 12 with this setting.
    uint public constant PRECISION = 10_000;

    IGauge public constant tokenGauge = IGauge(0xeAE066C25106006fB386A3a8b1698A0cB6931c1a);
    IERC20 public constant LP_TOKEN = IERC20(0x0B25c51637c43decd6CC1C1e3da4518D54ddb528);
    IERC20 public constant AERO = IERC20(0x940181a94A35A4569E4529A3CDfB74e38FD98631);
    IRouter public constant router = IRouter(0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43);
    IERC20 public constant TOKEN = IERC20(0x4621b7A9c75199271F773Ebd9A499dbd165c3191);
    IERC20 public constant USDC = IERC20(0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA);
    address public constant factory = 0x420DD381b31aEf6683db6B902084cB0FFECe40Da;

    error OnlyManagement();
    error OnlyGuardian();

    error MaxSlippageTooHigh();
    error NotEnoughTokens();
    error LiquiditySlippageTooHigh();
    
    modifier onlyManager() {
        if(msg.sender!=manager){
            revert OnlyManagement();
        }
        _;
    }

    modifier onlyGuardian() {
        if(msg.sender!=guardian){
            revert OnlyGuardian();
        }
        _;
    }

    constructor(
        address treasury_,
        address manager_,
        address guardian_,
        uint maxSlippageBpsTokenToUsdc_,
        uint maxSlippageBpsUsdcToToken_,
        uint maxSlippageBpsLiquidity_
    )
    {   
        // recieves the rewards
        treasury = treasury_;
        // manages the liquidity
        manager = manager_;
        // manages control
        guardian = guardian_;
        maxSlippageBpsTokenToUsdc = maxSlippageBpsTokenToUsdc_;
        maxSlippageBpsUsdcToToken = maxSlippageBpsUsdcToToken_;
        maxSlippageBpsLiquidity = maxSlippageBpsLiquidity_;
    }

    function claimAeroRewards() external {
        tokenGauge.getReward(address(this));
        AERO.transfer(treasury, AERO.balanceOf(address(this)));
    }

    function deposit(uint tokenAmount, uint usdcAmount) public onlyManager {
        uint lpTokenPrice = getLpTokenPrice();
        TOKEN.approve(address(router), tokenAmount);
        USDC.approve(address(router), usdcAmount);
        (uint tokenSpent, uint usdcSpent, uint lpTokensReceived) = router.addLiquidity(address(TOKEN), address(USDC), true, tokenAmount, usdcAmount, 0, 0, address(this), block.timestamp);
        require(lpTokensReceived > 0, "No LP tokens received");

        uint totalTokenValue = tokenSpent + (usdcSpent * TOKEN_USDC_CONVERSION_MULTI);
        uint expectedLpTokens = totalTokenValue * 1e18 / lpTokenPrice * (PRECISION - maxSlippageBpsLiquidity) / PRECISION;
        if (lpTokensReceived < expectedLpTokens) revert LiquiditySlippageTooHigh();
        
        LP_TOKEN.approve(address(tokenGauge), LP_TOKEN.balanceOf(address(this)));
        tokenGauge.deposit(LP_TOKEN.balanceOf(address(this)));
    }

    function depositAll() onlyManager external {
        deposit(TOKEN.balanceOf(address(this)), USDC.balanceOf(address(this)));
    }

    function withdrawLiquidity(uint tokenAmount) public onlyManager returns (uint) {
        uint lpTokenPrice = getLpTokenPrice();
        uint liquidityToWithdraw = tokenAmount * 1e18 / lpTokenPrice;
        uint ownedLiquidity = tokenGauge.balanceOf(address(this));

        if (liquidityToWithdraw > ownedLiquidity) liquidityToWithdraw = ownedLiquidity;
        tokenGauge.withdraw(liquidityToWithdraw);

        LP_TOKEN.approve(address(router), liquidityToWithdraw);
        (uint amountUSDC, uint amountToken) = router.removeLiquidity(
                                                                        address(USDC), 
                                                                        address(TOKEN), 
                                                                        true, 
                                                                        liquidityToWithdraw, 
                                                                        0, 
                                                                        0, 
                                                                        address(this),
                                                                        block.timestamp
                                                                        );

        uint totalTokenReceived = amountToken + (amountUSDC * TOKEN_USDC_CONVERSION_MULTI);

        if ((tokenAmount * (PRECISION - maxSlippageBpsLiquidity) / PRECISION) > totalTokenReceived) {
            revert LiquiditySlippageTooHigh();
        }

        return amountUSDC;
    }

    function withdrawLiquidityAndSwapToTOKEN(uint tokenAmount) onlyManager external {
        uint usdcAmount = withdrawLiquidity(tokenAmount);
        swapUSDCtoTOKEN(usdcAmount);
    }

    function swapUSDCtoTOKEN(uint usdcAmount) onlyManager public {
        uint minOut = usdcAmount * (PRECISION - maxSlippageBpsUsdcToToken) / PRECISION * TOKEN_USDC_CONVERSION_MULTI;
        USDC.approve(address(router), usdcAmount);
        router.swapExactTokensForTokens(usdcAmount, minOut, getRoute(address(USDC), address(TOKEN)), address(this), block.timestamp);
    }

    function swapTOKENtoUSDC(uint tokenAmount) onlyManager public { 
        uint minOut = tokenAmount * (PRECISION - maxSlippageBpsTokenToUsdc) / PRECISION / TOKEN_USDC_CONVERSION_MULTI;
        TOKEN.approve(address(router), tokenAmount);
        router.swapExactTokensForTokens(tokenAmount, minOut, getRoute(address(TOKEN), address(USDC)), address(this), block.timestamp);
    }

    function getLpTokenPrice() internal view returns (uint) {
        (uint tokenAmountOneLP, uint usdcAmountOneLP) = router.quoteRemoveLiquidity(address(TOKEN), address(USDC), true, factory, 0.001 ether);
        usdcAmountOneLP *= TOKEN_USDC_CONVERSION_MULTI;
        return (tokenAmountOneLP + usdcAmountOneLP) * 1000;
    }

    function getRoute(address from, address to) internal pure returns(IRouter.Route[] memory){
        IRouter.Route memory route = IRouter.Route(from, to, true, factory);
        IRouter.Route[] memory routeArray = new IRouter.Route[](1);
        routeArray[0] = route;
        return routeArray;
    }

    function setMaxSlippageTokenToUsdc(uint newMaxSlippageBps) onlyGuardian external {
        if (newMaxSlippageBps > 10000) revert MaxSlippageTooHigh();
        maxSlippageBpsTokenToUsdc = newMaxSlippageBps;
    }

    function setMaxSlippageUsdcToToken(uint newMaxSlippageBps) external {
        if (newMaxSlippageBps > 10000) revert MaxSlippageTooHigh();
        maxSlippageBpsUsdcToToken = newMaxSlippageBps;
    }

    function setMaxSlippageLiquidity(uint newMaxSlippageBps) onlyGuardian external {
        if (newMaxSlippageBps > 10000) revert MaxSlippageTooHigh();
        maxSlippageBpsLiquidity = newMaxSlippageBps;
    }

    function changeTreasury(address newTreasury_) onlyGuardian external {
        treasury = newTreasury_;
    }
}