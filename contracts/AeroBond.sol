// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "./IRouter.sol";
import "./IERC20.sol";
import "./IGauge.sol";

contract AeroBond {
    address public manager;
    address public treasury;
    address public guardian;

    IGauge public constant tokenGauge = IGauge(0xeAE066C25106006fB386A3a8b1698A0cB6931c1a);
    IERC20 public constant LP_TOKEN = IERC20(0x0B25c51637c43decd6CC1C1e3da4518D54ddb528);
    IERC20 public constant AERO = IERC20(0x940181a94A35A4569E4529A3CDfB74e38FD98631);
    IRouter public constant router = IRouter(0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43);
    IERC20 public constant TOKEN = IERC20(0x4621b7A9c75199271F773Ebd9A499dbd165c3191);
    IERC20 public constant WETH = IERC20(0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA);
    address public constant factory = 0x420DD381b31aEf6683db6B902084cB0FFECe40Da;

    error OnlyManagement();
    error OnlyGuardian();

    error MaxSlippageTooHigh();
    error NotEnoughTokens();
    error LiquiditySlippageTooHigh();

    modifier onlyGuardian() {
        if(msg.sender!=guardian){
            revert OnlyGuardian();
        }
        _;
    }

    constructor(
        address treasury_,
        address manager_,
        address guardian_
    )
    {   
        // recieves the rewards
        treasury = treasury_;
        // manages the liquidity
        manager = manager_;
        // manages control
        guardian = guardian_;
    }

    function claimAeroRewards() external {
        tokenGauge.getReward(address(this));
        AERO.transfer(treasury, AERO.balanceOf(address(this)));
    }

    function deposit(uint wethAmount) public {
        WETH.transferFrom(msg.sender, address(this), wethAmount);
        WETH.approve(address(router), wethAmount);

        uint256 tokenHeld = TOKEN.balanceOf(address(this));

        (uint tokenSpent, uint wethSpent, uint lpTokensReceived) = router.addLiquidity(address(TOKEN), address(WETH), true, tokenHeld, wethAmount, 0, 0, address(this), block.timestamp);
        require(lpTokensReceived > 0, "No LP tokens received");

        WETH.transfer(msg.sender, (wethAmount-wethSpent));
        TOKEN.transfer(msg.sender, tokenSpent);

        tokenGauge.deposit(LP_TOKEN.balanceOf(address(this)));
    }

    function getRoute(address from, address to) internal pure returns(IRouter.Route[] memory){
        IRouter.Route memory route = IRouter.Route(from, to, true, factory);
        IRouter.Route[] memory routeArray = new IRouter.Route[](1);
        routeArray[0] = route;
        return routeArray;
    }

    function changeTreasury(address newTreasury_) onlyGuardian external {
        treasury = newTreasury_;
    }
}