import { EthersIgnitionHelper } from "@nomicfoundation/hardhat-ignition-ethers/dist/src/ethers-ignition-helper";
import hre, { ethers } from "hardhat";

async function main() {
  console.log("Testing AeroBond.sol deposit flow");
  const [deployer] = await ethers.getSigners();

  const aerobondAddress = "0xc17ad95bb4Fa1a4713ABa8100A4DAfD1F206BD3e";
  const WETH = await ethers.getContractAt("EditableERC20", "0xAdf7A935FFb90e8cE5dc1B74200a3EEDA0eF21e3");
  const TOKEN = await ethers.getContractAt("EditableERC20", "0x6928e88007efe020a6b2d38eb68eb4e3ac9288aa");

  const aerobond = await ethers.getContractAt("AeroBondTest", aerobondAddress);

  console.log("WETH contract fetched at address:",(await WETH.getAddress()));

  const wethAmount = ethers.parseEther("10"); // 100 WETH
  await WETH.connect(deployer).approve(aerobondAddress, wethAmount);
  console.log(`Approved ${ethers.formatEther(wethAmount)} WETH for deposit to AeroBond.`);

  const initialTokenBalance = await TOKEN.balanceOf(deployer.address);
  const initialWETHBalance = await WETH.balanceOf(deployer.address);

  await aerobond.connect(deployer).deposit(wethAmount);
  const finalTokenBalance = await TOKEN.balanceOf(deployer.address);
  const finalWETHBalance = await WETH.balanceOf(deployer.address);

  const aerobondTokenBalance = await TOKEN.balanceOf(aerobondAddress);

  console.log(`AeroBond contract TOKEN balance: ${ethers.formatEther(aerobondTokenBalance)} TOKEN`);


  console.log(`Deposited ${ethers.formatEther(wethAmount)} WETH to AeroBond.`);
  console.log(`Token balance before deposit: ${ethers.formatEther(initialTokenBalance)} TOKEN`);
  console.log(`Token balance after deposit: ${ethers.formatEther(finalTokenBalance)} TOKEN`);

  const tokenDelta = parseFloat(ethers.formatEther(finalTokenBalance)) - parseFloat(ethers.formatEther(initialTokenBalance));
  console.log(`Token balance change: ${tokenDelta} TOKEN`);

  console.log(`WETH balance before deposit: ${ethers.formatEther(initialWETHBalance)} WETH`);
  console.log(`WETH balance after deposit: ${ethers.formatEther(finalWETHBalance)} WETH`);

  const wethDelta = parseFloat(ethers.formatEther(initialWETHBalance)) - parseFloat(ethers.formatEther(finalWETHBalance));
  console.log(`WETH balance change: ${wethDelta} WETH`);
  
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
