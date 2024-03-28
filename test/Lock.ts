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

  describe("Meme Creation, Purchase, and Token URI Verification", function () {
    it("Should allow a user to create multiple memes", async function () {
      this.timeout(100000)
      const { rogaine, deployer } = await loadFixture(deployRogaineFixture);
      const numberOfMemes = 3;
      const createTxPromises = [];
      for (let i = 0; i < numberOfMemes; i++) {
        createTxPromises.push(rogaine.createMeme(`ipfs://example${i}`, { value: ethers.parseEther("0.01") }));
      }
      const createTxs = await Promise.all(createTxPromises);

      for (let i = 0; i < numberOfMemes; i++) {
        await expect(createTxs[i])
          .to.emit(rogaine, "MemeCreated")
          .withArgs(i + 1, deployer.address); // Assuming the first token ID is 1 and increments with each creation
      }
    });

    it("Should allow a user to buy multiple memes", async function () {
      this.timeout(100000)

      const { rogaine, buyer } = await loadFixture(deployRogaineFixture);
      // First, create 10 memes to buy
      const numberOfMemes = 3;
      for (let i = 0; i < numberOfMemes; i++) {
        await rogaine.createMeme(`ipfs://example${i}`, { value: ethers.parseEther("0.01") });
      }
      // Attempt to buy the created memes
      const buyTxPromises = [];
      for (let i = 0; i < numberOfMemes; i++) {
        buyTxPromises.push(rogaine.buyMeme(i + 1, { value: ethers.parseEther("0.01") }));
      }
      const buyTxs = await Promise.all(buyTxPromises);

      for (let tx of buyTxs) {
        await expect(tx).to.not.be.reverted;
      }
    });

    it("Should verify the token URIs of multiple created memes", async function () {
      this.timeout(100000)

      const { rogaine, deployer } = await loadFixture(deployRogaineFixture);
      // Create 10 memes to verify their token URIs
      const numberOfMemes = 3;
      for (let i = 0; i < numberOfMemes; i++) {
        await rogaine.createMeme(`ipfs://example${i}`, { value: ethers.parseEther("0.01") });
      }
      for (let i = 0; i < numberOfMemes; i++) {
        await expect(rogaine.uri(i + 1))
          .to.eventually.equal(`ipfs://example${i}`, `The token URI of the created meme ${i + 1} does not match the expected value.`);
      }
    });
  });
});

