import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { IERC20, IWETH } from "../../typechain-types";
import { REGEN_ADDRESS, REGEN_WHALE, WETH_ADDRESS } from "./constants";
import { fundWeth, initAeroBond } from "./AeroBondInteractions";

async function deployAeroBondFixture() {
  const [deployer, buyer] = await ethers.getSigners();
  // Minting ETH to the deployer's wallet for testing purposes
  await hre.network.provider.send("hardhat_setBalance", [
    deployer.address,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);
  const AeroBond = await ethers.getContractFactory("AeroBond");
  const aerodromeRouterAddress = "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43"; // Aerodrome Router address
  const aeroBond = await AeroBond.deploy(
    deployer.address,
    deployer.address,
    50
  );
  const treasuryAddress = await aeroBond.treasury();
  const ownerAddress = await aeroBond.manager();
  console.log(`AeroBond Address: ${await aeroBond.getAddress()}`);
  console.log(`Treasury Address: ${treasuryAddress}`);
  console.log(`Owner Address: ${ownerAddress}`);
  console.log(`Current Deployer Address: ${deployer.address}`);
  return { aeroBond, deployer, buyer };
}

describe("AeroBond", function () {
  describe("Deployment", function () {
    it("should set the correct treasury and manager addresses", async function () {
      const { aeroBond, deployer } = await loadFixture(deployAeroBondFixture);
      const treasuryAddress = await aeroBond.treasury();
      const managerAddress = await aeroBond.manager();

      expect(treasuryAddress).to.equal(deployer.address);
      expect(managerAddress).to.equal(deployer.address);
    });
  });

  describe("Deposit", function () {
    context("when the user has enough WETH balance", function () {
      it("should allow the user to deposit WETH and receive LP tokens", async function () {
        const { aeroBond, deployer } = await loadFixture(deployAeroBondFixture);
        const aeroBondAddress = await aeroBond.getAddress();

        const { startingRegenBalance, regenContract } = await initAeroBond(
          aeroBondAddress
        );

        const wethAmount = ethers.parseEther("10");
        // Fund the deployer with WETH
        const weth = await fundWeth(WETH_ADDRESS, deployer.address, 10);
        expect(await weth.balanceOf(deployer.address)).to.be.greaterThan(0);

        const deployerWeth = weth.connect(deployer);
        await deployerWeth.approve(aeroBondAddress, wethAmount);

        console.log(
          `Depositing ${ethers.formatEther(
            wethAmount
          )} WETH to ${aeroBondAddress}`
        );
        await aeroBond.deposit(wethAmount);
        const regenBalanceAfterDeposit = await regenContract.balanceOf(
          aeroBondAddress
        );
        console.log(
          `Amount of regen deposited: ${ethers.formatEther(
            startingRegenBalance - regenBalanceAfterDeposit
          )}`
        );

        expect(await weth.balanceOf(deployer.address)).to.be.eq(0);
        expect(await regenContract.balanceOf(aeroBondAddress)).to.be.lt(
          startingRegenBalance
        );
      });
    });

    context("when the user does not have enough WETH balance", function () {
      it("should revert the transaction", async function () {
        const { aeroBond, deployer } = await loadFixture(deployAeroBondFixture);
        const wethAmount = ethers.parseEther("10");
        const aeroBondAddress = await aeroBond.getAddress();

        // Approve the AeroBond contract to spend WETH
        const weth = (await ethers.getContractAt(
          "contracts/IERC20.sol:IERC20",
          WETH_ADDRESS
        )) as unknown as IERC20;
        await weth.connect(deployer).approve(aeroBondAddress, wethAmount);

        // Attempt to deposit WETH without funding the deployer
        await expect(
          aeroBond.connect(deployer).deposit(wethAmount)
        ).to.be.revertedWithoutReason();
      });
    });
  });
});
