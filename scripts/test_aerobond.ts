import { EthersIgnitionHelper } from "@nomicfoundation/hardhat-ignition-ethers/dist/src/ethers-ignition-helper";
import hre, { ethers } from "hardhat";

async function main() {
  console.log("Testing AeroBond.sol deposit flow");
  const AeroBond = await ethers.getContractFactory("AeroBondTest");
  const TestToken = await ethers.getContractFactory("EditableERC20");
  const [deployer] = await ethers.getSigners();

  // Deploy AeroBond contract with test tokens
  const aerobond = await AeroBond.deploy(deployer.address, deployer.address, "0x0137a6c6ab1086aef813f3dcae6a5dcb43a5120c", "0x6928e88007eFe020a6b2D38eB68eb4E3AC9288aa", "0xAdf7A935FFb90e8cE5dc1B74200a3EEDA0eF21e3");

  console.log("AeroBond deployed to:", (await aerobond.getAddress()));

  const WETH = await ethers.getContractAt("EditableERC20", "0xAdf7A935FFb90e8cE5dc1B74200a3EEDA0eF21e3");
  console.log("WETH contract fetched at address:", (await WETH.getAddress()));

  const TOKEN = await ethers.getContractAt("EditableERC20", "0x6928e88007eFe020a6b2D38eB68eb4E3AC9288aa");

  const balanceOfToken = await TOKEN.balanceOf(deployer.address);

  await TOKEN.transfer((await aerobond.getAddress()), balanceOfToken) // all of it
  
  // Deployer tries to deposit WETH into AeroBond
  const wethAmount = ethers.parseEther("10"); // 10 WETH
  await WETH.connect(deployer).approve((await aerobond.getAddress()), wethAmount);
  await aerobond.connect(deployer).deposit(wethAmount);

  console.log(`Deposit of ${ethers.formatEther(wethAmount)} WETH successful`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
