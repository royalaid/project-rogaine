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
    const Rogaine = await ethers.getContractFactory("Rogaine");
    const aerodromeRouterAddress = "0x"; // Mock or actual Aerodrome Router address
    const memeCoinAddress = "0x"; // Mock or actual Meme Coin address
    const rogaine = await Rogaine.deploy(aerodromeRouterAddress, memeCoinAddress);

    return { rogaine, deployer, buyer };
  }

  describe("Meme Creation and Purchase", function () {
    it("Should allow a user to create a meme", async function () {
      const { rogaine, deployer } = await loadFixture(deployRogaineFixture);
      const createTx = await rogaine.createMeme("ipfs://example", { value: ethers.utils.parseEther("0.01") });

      await expect(createTx)
        .to.emit(rogaine, "MemeCreated")
        .withArgs(1, deployer.address); // Assuming the first token ID is 1
    });

    it("Should allow a user to buy a meme", async function () {
      const { rogaine, buyer } = await loadFixture(deployRogaineFixture);
      // First, create a meme to buy
      await rogaine.createMeme("ipfs://example", { value: ethers.utils.parseEther("0.01") });
      // Attempt to buy the created meme
      const buyTx = await rogaine.buyMeme(1, { value: ethers.utils.parseEther("0.01") });

      await expect(buyTx)
        .to.emit(rogaine, "MemePurchased")
        .withArgs(1, buyer.address, 1); // We accept any value for memeCoinsBought
    });
  });
});

