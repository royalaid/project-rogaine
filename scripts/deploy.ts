import { ethers } from "hardhat";

async function main() {
  console.log("Hello, World!");
  const AeroRogaineFactory = await ethers.getContractFactory(
    "AerogaineFactory"
  );
  const aerodromeRouterAddress = "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43"; // Aerodrome Router address
  const memeCoinAddress = "0xd3fdcb837dafdb7c9c3ebd48fe22a53f6dd3d7d7"; // Example Meme Coin Address
  const factory = await AeroRogaineFactory.deploy();
  console.log("AeroRogaineFactory deployed to:", await factory.getAddress());
  await factory.createRogaine(memeCoinAddress);
  const deployedRogaines = await factory.getDeployedRogaines();
  const deployer = (await ethers.getSigners())[0];
  const rogaine = await ethers.getContractAt("Rogaine", deployedRogaines[0]);
  const deployerAddress = await rogaine.owner();
  console.log(`Factory Address: ${await factory.getAddress()}`);
  console.log(`Deployer Address: ${deployerAddress}`);
  console.log(`Current Deployer Address: ${deployer.address}`);
  await rogaine.setAllowListing(false);

  console.log("Rogaine deployed at:", deployedRogaines[0]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
