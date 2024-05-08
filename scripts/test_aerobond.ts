import hre, { ethers } from "hardhat";

async function main() {
  console.log("Testing AeroBond.sol deposit flow");
  const AeroBond = await ethers.getContractFactory("AeroBond");
  const [deployer] = await ethers.getSigners();

  console.log(`Deployer Address: ${deployer.address}`);

  // Deploy AeroBond contract
  const aerobond = await AeroBond.deploy(deployer.address, deployer.address);

  console.log("AeroBond deployed to:", await aerobond.getAddress());

  // Impersonate account with a lot of REGEN
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0xa044c595d085a8956569b3bd996be420e89533de"],
  });
  const regenHolder = await ethers.getSigner("0xa044c595d085a8956569b3bd996be420e89533de");
  const TOKEN = await ethers.getContractAt("IERC20", "0x1D653f09f216682eDE4549455D6Cf45f93C730cf");
  await TOKEN.connect(regenHolder).transfer(aerobond.getAddress(), ethers.parseEther("1000000"));

  // Impersonate account with a lot of WETH
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: ["0xcdac0d6c6c59727a65f871236188350531885c43"],
  });
  const wethHolder = await ethers.getSigner("0xcdac0d6c6c59727a65f871236188350531885c43");
  const WETH = await ethers.getContractAt("IERC20", "0x4200000000000000000000000000000000000006");
  const wethBalance = await WETH.balanceOf(wethHolder.address);

  // Set balance of wethHolder to have enough ETH for transactions
  await hre.network.provider.send("hardhat_setBalance", [
    wethHolder.address,
    "0x8AC7230489E80000", // Setting 10 ETH
  ]);
  await WETH.connect(wethHolder).transfer(deployer.address, wethBalance);

  // Deployer tries to deposit WETH into AeroBond
  const wethAmount = ethers.parseEther("0.0001"); // 10 WETH
  await WETH.connect(deployer).approve(( await aerobond.getAddress()), wethAmount);
  await aerobond.connect(deployer).deposit(wethAmount);

  console.log(`Deposit of ${wethAmount} WETH successful`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
