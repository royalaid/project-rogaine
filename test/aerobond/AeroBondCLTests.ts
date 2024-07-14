import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { M_ETH_ADDRESS, WETH_M_ETH_CL_POOL_ADDRESS } from "./constants";
import { initAeroBondForMethToken, initNftLiquidityPosition } from "./QethCLInteractions";

async function deployAeroBondFixture() {
  const [deployer, buyer] = await ethers.getSigners();
  // Minting ETH to the deployer's wallet for testing purposes
  await hre.network.provider.send("hardhat_setBalance", [
    deployer.address,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);
  await hre.network.provider.send("hardhat_setBalance", [
    buyer.address,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);
  const AeroBond = await ethers.getContractFactory("AeroBond");
  const aerodromeRouterAddress = "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43"; // Aerodrome Router address
  const aeroBond = await AeroBond.deploy(deployer.address, deployer.address, 5000, M_ETH_ADDRESS, true);
  const treasuryAddress = await aeroBond.treasury();
  const ownerAddress = await aeroBond.manager();
  console.log(`AeroBond Address: ${await aeroBond.getAddress()}`);
  console.log(`Treasury Address: ${treasuryAddress}`);
  console.log(`Owner Address: ${ownerAddress}`);
  console.log(`Current Deployer Address: ${deployer.address}`);
  return { aeroBond, deployer, buyer };
}

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

describe("AeroBond", function () {
  // beforeEach(async () => {
  //   initSwapRecords();
  // });
  describe("Deployment", function () {
    it("should set the correct treasury and manager addresses", async function () {
      const { aeroBond, deployer } = await loadFixture(deployAeroBondFixture);
      const treasuryAddress = await aeroBond.treasury();
      const managerAddress = await aeroBond.manager();

      expect(treasuryAddress).to.equal(deployer.address);
      expect(managerAddress).to.equal(deployer.address);
    });
  });

  describe("mEthToken", function () {
    it("should init and mint position", async function () {
      const { deployer, aeroBond } = await loadFixture(deployAeroBondFixture);
      await initAeroBondForMethToken(await aeroBond.getAddress());
      await initNftLiquidityPosition(deployer, WETH_M_ETH_CL_POOL_ADDRESS);
    });
  });
});
