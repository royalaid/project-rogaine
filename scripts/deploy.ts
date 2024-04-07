import { setBalance } from "@nomicfoundation/hardhat-network-helpers";
import hre, { ethers } from "hardhat";

async function main() {
  console.log("Hello, World!");
  const AeroRogaineFactory = await ethers.getContractFactory(
    "AerogaineFactory"
  );
  const [deployer] = await ethers.getSigners();

  console.log(`Deployer Address: ${deployer.address}`);
  await hre.network.provider.send("hardhat_setBalance", [
    deployer.address,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);
  await setBalance("0x93798Ef7e3A621d7C4EfF22eDA50B931fE57a3cF", 100n ** 18n);

  // const aerodromeRouterAddress = "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43"; // Aerodrome Router address
  const memeCoinAddress = "0xd3fdcb837dafdb7c9c3ebd48fe22a53f6dd3d7d7"; // Example Meme Coin Address
  const factory = await AeroRogaineFactory.deploy();
  console.log("AeroRogaineFactory deployed to:", await factory.getAddress());
  await factory.createRogaine(memeCoinAddress);
  const deployedRogaines = await factory.getDeployedRogaines();
  const rogaine = await ethers.getContractAt("Rogaine", deployedRogaines[0]);
  const ownerAddress = await rogaine.owner();
  console.log(`Rogaine Owner Address: ${ownerAddress}`);
  await rogaine.setAllowListing(false);

  console.log("Rogaine deployed at:", deployedRogaines[0]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
