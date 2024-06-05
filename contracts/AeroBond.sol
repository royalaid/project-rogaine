// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./IRouter.sol";
import "./IERC20.sol";
import "./IGauge.sol";

contract AeroBond {
    address public manager;
    address public treasury;

    IERC20 public constant LP_TOKEN = IERC20(0x11D9944cB1886F5Ca08673C0B61b4d159946AcDa); // REGEN/WETH

    IERC20 public constant AERO = IERC20(0x940181a94A35A4569E4529A3CDfB74e38FD98631); // AERO
    IRouter public constant router = IRouter(0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43); // Router
    IERC20 public constant TOKEN = IERC20(0x1D653f09f216682eDE4549455D6Cf45f93C730cf); // REGEN
    IERC20 public constant WETH = IERC20(0x4200000000000000000000000000000000000006); // WETH

    uint256 public ratio;
    uint256 public TEN_THOUSAND = 10_000;

    IGauge public tokenGauge;
    bool public tokenGaugeEnabled;

    error OnlyManagement();

    modifier onlyManager() {
        if (msg.sender != manager) {
            revert OnlyManagement();
        }
        _;
    }

    constructor(address treasury_, address manager_, uint256 ratio_) {
        // recieves the rewards
        treasury = treasury_;
        // manages the liquidity
        manager = manager_;

        ratio = ratio_;
    }

    function claimAeroRewards() external {
        tokenGauge.getReward(address(this));
        AERO.transfer(treasury, AERO.balanceOf(address(this)));
    }

    function setRatio(uint256 ratio_) external onlyManager {
        require(ratio_ <= TEN_THOUSAND);
        ratio = ratio_;
    }

    function initializeGauge(address tokenGauge_) external onlyManager {
        tokenGaugeEnabled = true;
        tokenGauge = IGauge(tokenGauge_);
    }

    function disableGauge() external onlyManager {
        tokenGaugeEnabled = false;
    }

    function changeTreasury(address newTreasury_) external onlyManager {
        treasury = newTreasury_;
    }

    function transferTokens(address token) external onlyManager {
        IERC20(token).transfer(treasury, IERC20(token).balanceOf(address(this)));
    }

    function deposit(uint256 wethAmount) public {
        WETH.transferFrom(msg.sender, address(this), wethAmount);

        WETH.approve(address(router), wethAmount);

        uint256 tokenHeld = TOKEN.balanceOf(address(this));
        TOKEN.approve(address(router), tokenHeld);

        (uint256 tokenSpent, uint256 wethSpent, uint256 lpTokensReceived) = router.addLiquidity(
            address(TOKEN), address(WETH), false, tokenHeld, wethAmount, 0, 0, address(this), block.timestamp
        );
        require(lpTokensReceived > 0, "No LP tokens received");

        WETH.transfer(msg.sender, (wethAmount - wethSpent));

        uint256 given = tokenSpent * ratio / TEN_THOUSAND;

        TOKEN.transfer(msg.sender, given);

        if (tokenGaugeEnabled) {
            tokenGauge.deposit(LP_TOKEN.balanceOf(address(this)));
        }
    }

    function withdrawLiquidity() public onlyManager returns (uint256, uint256) {
        uint256 ownedLiquidity = tokenGauge.balanceOf(address(this));

        tokenGauge.withdraw(ownedLiquidity);

        LP_TOKEN.approve(address(router), ownedLiquidity);
        (uint256 amountWETH, uint256 amountToken) = router.removeLiquidity(
            address(WETH), address(TOKEN), false, ownedLiquidity, 0, 0, address(this), block.timestamp
        );
        return (amountWETH, amountToken);
    }
}
