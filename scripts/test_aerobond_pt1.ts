import hre, { ethers } from "hardhat";

async function main() {
  console.log("Testing AeroBond.sol deposit flow");
  const AeroBond = await ethers.getContractFactory("AeroBondTest");
  const TestToken = await ethers.getContractFactory("EditableERC20");
  const [deployer] = await ethers.getSigners();

  console.log(`Deployer Address: ${deployer.address}`);

  // Deploy test ERC20 tokens for TOKEN and WETH
  const TOKEN = await TestToken.deploy("Test REGEN Token", "tREGEN");
  const WETH = await TestToken.deploy("Test WETH Token", "tWETH");

  console.log("token is: ", await TOKEN.getAddress())
  console.log("weth is: ", await WETH.getAddress());

  const largeAmount = ethers.parseUnits("10000000000000", 18); // 10 trillion with 18 decimals
  await TOKEN.mint(deployer.address, largeAmount);
  await WETH.mint(deployer.address, largeAmount);
  console.log(`Minted 10 trillion TOKEN and WETH to deployer address: ${deployer.address}`);

  /*
  // Deploy AeroBond contract with test tokens
  const aerobond = await AeroBond.deploy(deployer.address, deployer.address, (await TOKEN.getAddress()), (await WETH.getAddress()));

  console.log("AeroBond deployed to:", (await aerobond.getAddress()));

  // Mint tokens to simulate having a lot of REGEN and WETH
  await TOKEN.mint(deployer.address, ethers.parseEther("1000000"));
  await WETH.mint(deployer.address, ethers.parseEther("1000000"));

  // Deployer tries to deposit WETH into AeroBond
  const wethAmount = ethers.parseEther("10"); // 10 WETH
  await WETH.connect(deployer).approve(aerobond.address, wethAmount);
  await aerobond.connect(deployer).deposit(wethAmount);

  console.log(`Deposit of ${ethers.formatEther(wethAmount)} WETH successful`);
  */
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
