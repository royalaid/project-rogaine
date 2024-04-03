import { ethers } from "hardhat";

async function main() {
  const AeroRogaineFactory = await ethers.getContractFactory("AerogaineFactory");
  const aerodromeRouterAddress = "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43"; // Aerodrome Router address
  const memeCoinAddress = "0xd3fdcb837dafdb7c9c3ebd48fe22a53f6dd3d7d7"; // Example Meme Coin Address

  const factory = await AeroRogaineFactory.deploy();

  console.log("AeroRogaineFactory deployed to:", factory.address);

  await factory.createRogaine(memeCoinAddress);
  const deployedRogaines = await factory.getDeployedRogaines();
  console.log("Rogaine deployed at:", deployedRogaines[0]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
