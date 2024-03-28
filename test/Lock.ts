import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre, {ethers} from "hardhat";

describe("Rogaine", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployRogaineFixture() {
    const [deployer, buyer] = await ethers.getSigners();
    // Minting ETH to the deployer's wallet for testing purposes
    await hre.network.provider.send("hardhat_setBalance", [
      deployer.address,
      "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
    ]);
    const Rogaine = await ethers.getContractFactory("Rogaine");
    const aerodromeRouterAddress = "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43"; // Mock or actual Aerodrome Router address
    const memeCoinAddress = "0xd3fdcb837dafdb7c9c3ebd48fe22a53f6dd3d7d7"; // Mock or actual Meme Coin address
    const rogaine = await Rogaine.deploy(aerodromeRouterAddress, memeCoinAddress);

    return { rogaine, deployer, buyer };
  }

  describe("Meme Creation and Purchase", function () {
    it("Should allow a user to create a meme", async function () {
      const { rogaine, deployer } = await loadFixture(deployRogaineFixture);
      const createTx = await rogaine.createMeme("ipfs://example", { value: ethers.parseEther("0.01") });

      await expect(createTx)
        .to.emit(rogaine, "MemeCreated")
        .withArgs(1, deployer.address); // Assuming the first token ID is 1
    });

    it("Should allow a user to buy a meme", async function () {
      const { rogaine, buyer } = await loadFixture(deployRogaineFixture);
      // First, create a meme to buy
      await rogaine.createMeme("ipfs://example", { value: ethers.parseEther("0.01") });
      // Attempt to buy the created meme
      const buyTx = await rogaine.buyMeme(1, { value: ethers.parseEther("0.01") });

      await expect(buyTx).to.not.be.reverted;
    });
  });
});

