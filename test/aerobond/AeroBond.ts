import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { TEST_TOKEN_ADDRESS, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, WETH_ADDRESS, addressToTokenName, percentFormatter } from "./constants";
import { initAeroBondForTestToken, poolStats } from "./AeroBondInteractions";

import { getSwapRecords, swap } from "../utils/trading";

import { calculateSwapAmount } from "../utils/pool";
import { fundWeth, depositWeth } from "./QethCLInteractions";

async function deployAeroBondFixture() {
  const [deployer, buyer] = await ethers.getSigners();
  // Minting ETH to the deployer's wallet for testing purposes
  await hre.network.provider.send("hardhat_setBalance", [
    deployer.address,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);
  await hre.network.provider.send("hardhat_setBalance", [
    buyer.address,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);
  const AeroBond = await ethers.getContractFactory("AeroBond");
  const aerodromeRouterAddress = "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43"; // Aerodrome Router address
  const aeroBond = await AeroBond.deploy(deployer.address, deployer.address, 5000, TEST_TOKEN_ADDRESS, true);
  const treasuryAddress = await aeroBond.treasury();
  const ownerAddress = await aeroBond.manager();
  console.log(`AeroBond Address: ${await aeroBond.getAddress()}`);
  console.log(`Treasury Address: ${treasuryAddress}`);
  console.log(`Owner Address: ${ownerAddress}`);
  console.log(`Current Deployer Address: ${deployer.address}`);
  return { aeroBond, deployer, buyer };
}

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

// const deployRegenAeroBondFixture = createAeroBondFixture(REGEN_ADDRESS, false);
// const deployTestTokenAeroBondFixture = createAeroBondFixture(
//   TEST_TOKEN_ADDRESS,
//   true
// );

describe("AeroBond", function () {
  // beforeEach(async () => {
  //   initSwapRecords();
  // });
  describe("Deployment", function () {
    it("should set the correct treasury and manager addresses", async function () {
      const { aeroBond, deployer } = await loadFixture(deployAeroBondFixture);
      const treasuryAddress = await aeroBond.treasury();
      const managerAddress = await aeroBond.manager();

      expect(treasuryAddress).to.equal(deployer.address);
      expect(managerAddress).to.equal(deployer.address);
    });
  });

  describe("TestToken", function () {
    //test just us, price deviation and bringing it back
    //test us with others, where we create liquidity, someone pushes it out, then we bring it back
    //probably someone is putting it in the LP
    const logSwaps = false;
    const logReserves = false;
    const logSwapExpected = false;

    it("should allow the user to mint tokens", async function () {
      const testName = this?.test?.title || "";
      const { aeroBond, deployer } = await loadFixture(deployAeroBondFixture);
      const wethAmount = ethers.parseEther("168");
      const weth = await fundWeth(WETH_ADDRESS, deployer, 200);
      const stable = false;

      const aeroBondAddress = await aeroBond.getAddress();
      const { startingTestTokenBalance, testToken } = await initAeroBondForTestToken(aeroBondAddress, 10_000);
      console.log(`Deployer WETH balance: ${ethers.formatEther(await weth.balanceOf(deployer.address))}`);
      console.log(`Starting test token balance: ${ethers.formatEther(startingTestTokenBalance)}`);
      await depositWeth(deployer, weth, wethAmount, aeroBondAddress, async (amount: bigint) => {
        await aeroBond.connect(deployer).deposit(amount);
      });
      expect(startingTestTokenBalance).to.be.greaterThan(0);
      // const aeroRouter = IUniveralRouter__factory.connect(
      //   "0x6Cb442acF35158D5eDa88fe602221b67B400Be3E"
      // );

      const testTokenBeforeSwap = await testToken.balanceOf(deployer);
      const wethBeforeSwap = await weth.balanceOf(deployer);
      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
        proposedSwapAmount: ethers.parseEther("10"),
      });

      await swap({
        signer: deployer,
        from: weth,
        to: testToken,
        amount: ethers.parseEther("10"),
        minOut: 0n,
        stable,
        log: logSwaps,
        isRebalance: false,
        testName,
      });
      const testTokenAfterSwap = await testToken.balanceOf(deployer);
      const wethAfterSwap = await weth.balanceOf(deployer);
      expect(testTokenAfterSwap).to.be.greaterThan(testTokenBeforeSwap);
      expect(wethAfterSwap).to.be.lessThan(wethBeforeSwap);

      console.log("After 10 swap");
      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
        proposedSwapAmount: ethers.parseEther("10"),
      });

      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
        proposedSwapAmount: ethers.parseEther("30"),
      });
      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
        proposedSwapAmount: ethers.parseEther("50"),
      });
      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
        proposedSwapAmount: ethers.parseEther("100"),
      });
    });

    it("should swap out and back again", async function () {
      const testName = this?.test?.title || "";
      const { aeroBond, deployer } = await loadFixture(deployAeroBondFixture);
      const wethAmount = ethers.parseEther("168");
      const weth = await fundWeth(WETH_ADDRESS, deployer, 200);
      const stable = true;

      const aeroBondAddress = await aeroBond.getAddress();
      const { startingTestTokenBalance, testToken } = await initAeroBondForTestToken(aeroBondAddress, 10_000);
      console.log(`Deployer WETH balance: ${ethers.formatEther(await weth.balanceOf(deployer.address))}`);
      console.log(`Starting test token balance: ${ethers.formatEther(startingTestTokenBalance)}`);
      await depositWeth(deployer, weth, wethAmount, aeroBondAddress, async (amount: bigint) => {
        await aeroBond.connect(deployer).deposit(amount);
      });
      const testTokenBeforeSwap = await testToken.balanceOf(deployer);
      const wethBeforeSwap = await weth.balanceOf(deployer);
      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        proposedSwapAmount: ethers.parseEther("10"),
        stable,
      });

      await swap({
        signer: deployer,
        from: weth,
        to: testToken,
        amount: ethers.parseEther("10"),
        minOut: 0n,
        stable,
        log: logSwaps,
        isRebalance: false,
        testName,
      });

      await swap({
        signer: deployer,
        from: testToken,
        to: weth,
        amount: ethers.parseEther("10"),
        minOut: 0n,
        stable,
        log: logSwaps,
        isRebalance: false,
        testName,
      });

      const foo = await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        proposedSwapAmount: ethers.parseEther("10"),
        stable,
      });
      const { reserves } = foo;

      console.log("==== Entering our Balance Era ====");
      const xx = await calculateSwapAmount(
        {
          token: weth,
          reserve: reserves.from,
        },
        {
          token: testToken,
          reserve: reserves.to,
        }
      );
      // console.log({
      //   amt: ethers.formatEther(xx.amount),
      //   token: await xx.tokenToSwap.symbol(),
      // });
      console.log("==== Swapping ====");
      await swap({
        signer: deployer,
        to: xx.tokenToSwap,
        from: xx.tokenToReceive,
        amount: xx.amount,
        minOut: 0n,
        stable,
        log: logSwaps,
        isRebalance: true,
        testName,
      });
      console.log("==== Exiting our Balance Era ====");
      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        proposedSwapAmount: ethers.parseEther("1"),
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
      });
    });

    it("should handle external liquidity deposits", async function () {
      const testName = this?.test?.title || "";
      const stable = true;
      const { aeroBond, deployer, buyer } = await loadFixture(deployAeroBondFixture);
      const wethAmount = ethers.parseEther("168");
      const weth = await fundWeth(WETH_ADDRESS, deployer, 200);
      console.log(`Deployer WETH balance: ${ethers.formatEther(await weth.balanceOf(deployer.address))}`);

      const aeroBondAddress = await aeroBond.getAddress();
      const { startingTestTokenBalance, testToken } = await initAeroBondForTestToken(aeroBondAddress, 10_000);
      console.log(`Starting test token balance: ${ethers.formatEther(startingTestTokenBalance)}`);
      await depositWeth(deployer, weth, wethAmount, aeroBondAddress, async (amount: bigint) => {
        await aeroBond.connect(deployer).deposit(amount);
      });

      await swap({
        signer: deployer,
        from: weth,
        to: testToken,
        amount: ethers.parseEther("10"),
        minOut: 0n,
        stable,
        log: logSwaps,
        isRebalance: false,
        testName,
      });

      await swap({
        signer: deployer,
        from: testToken,
        to: weth,
        amount: ethers.parseEther("10"),
        minOut: 0n,
        stable,
        log: logSwaps,
        isRebalance: false,
        testName,
      });

      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
        proposedSwapAmount: ethers.parseEther("10"),
      });

      const buyerWeth = await fundWeth(WETH_ADDRESS, buyer, 200);

      await depositWeth(buyer, buyerWeth, wethAmount, aeroBondAddress, async (amount: bigint) => {
        await aeroBond.connect(buyer).deposit(amount);
      });

      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
        proposedSwapAmount: ethers.parseEther("10"),
      });
    });

    it("should handle lopside liquidity", async function () {
      const testName = this?.test?.title || "";
      const { aeroBond, deployer } = await loadFixture(deployAeroBondFixture);
      const wethAmount = ethers.parseEther("168");
      const weth = await fundWeth(WETH_ADDRESS, deployer, 500);
      const stable = true;

      console.log(`Deployer WETH balance: ${ethers.formatEther(await weth.balanceOf(deployer.address))}`);

      const aeroBondAddress = await aeroBond.getAddress();
      const { startingTestTokenBalance, testToken } = await initAeroBondForTestToken(aeroBondAddress, 10_000);
      console.log(`Starting test token balance: ${ethers.formatEther(startingTestTokenBalance)}`);
      await depositWeth(deployer, weth, wethAmount, aeroBondAddress, async (amount: bigint) => {
        await aeroBond.connect(deployer).deposit(amount);
      });
      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
        proposedSwapAmount: ethers.parseEther("10"),
      });

      await swap({
        signer: deployer,
        from: weth,
        to: testToken,
        amount: ethers.parseEther("100"),
        minOut: 0n,
        stable,
        log: logSwaps,
        isRebalance: false,
        testName,
      });

      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
        proposedSwapAmount: ethers.parseEther("10"),
      });

      await swap({
        signer: deployer,
        from: testToken,
        to: weth,
        amount: ethers.parseEther("150"),
        minOut: 0n,
        stable,
        log: logSwaps,
        isRebalance: false,
        testName,
      });

      const { reserves } = await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
        proposedSwapAmount: ethers.parseEther("10"),
      });

      console.log("==== Entering our Balance Era ====");
      const xx = await calculateSwapAmount(
        {
          token: weth,
          reserve: reserves.from,
        },
        {
          token: testToken,
          reserve: reserves.to,
        }
      );
      // console.log({
      //   amt: ethers.formatEther(xx.amount),
      //   token: await xx.tokenToSwap.symbol(),
      // });
      console.log("==== Swapping ====");
      await swap({
        signer: deployer,
        to: xx.tokenToSwap,
        from: xx.tokenToReceive,
        amount: xx.amount,
        minOut: 0n,
        stable,
        log: logSwaps,
        isRebalance: true,
        testName,
      });
      console.log("==== Exiting our Balance Era ====");
      await poolStats(deployer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
        proposedSwapAmount: ethers.parseEther("1"),
        from: WETH_ADDRESS,
        to: TEST_TOKEN_ADDRESS,
        stable,
      });
      console.table(
        getSwapRecords().map(({ from, to, fromAmt, fromReserves, toAmt, toReserves, slippage, file, line, isRebalance, testName }) => ({
          file,
          line,
          from: addressToTokenName.get(from),
          fromAmt: Number(ethers.formatEther(fromAmt)).toFixed(2),
          to: addressToTokenName.get(to),
          toAmt: Number(ethers.formatEther(toAmt)).toFixed(2),
          fromReserves: Number(ethers.formatEther(fromReserves)).toFixed(2),
          toReserves: Number(ethers.formatEther(toReserves)).toFixed(2),
          slippage: percentFormatter(slippage),
          rebal: isRebalance ? "✅" : "❌",
          testName,
        }))
      );
    });
  });
});
