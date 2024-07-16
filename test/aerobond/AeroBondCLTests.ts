import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { M_ETH_ADDRESS, WETH_ADDRESS, WETH_M_ETH_CL_POOL_ADDRESS } from "./constants";
import { initAeroBondForMethToken, initNftLiquidityPosition } from "./QethCLInteractions";
import { swap } from "../utils/trading";
import { IERC20, IQuoter, IWETH } from "../../typechain-types";
import { IQuoterV2 } from "../../typechain-types/contracts/IQuoter";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

async function getQuote(
  signer: HardhatEthersSigner,
  {
    amountIn,
    sqrtPriceLimitX96 = 0n,
    tokenIn,
    tokenOut,
    tickSpacing = 1,
  }: {
    amountIn: bigint;
    sqrtPriceLimitX96?: bigint;
    tokenIn: string;
    tokenOut: string;
    tickSpacing?: number;
  }
) {
  const quoterContract = (
    await ethers.getContractAt("contracts/IQuoter.sol:IQuoter", "0x254cF9E1E6e233aa1AC962CB9B05b2cfeAaE15b0")
  ).connect(signer) as unknown as IQuoter;

  type QuoteExactInputSingleParamsStruct = IQuoterV2.QuoteExactInputSingleParamsStruct;
  const params: QuoteExactInputSingleParamsStruct = {
    tokenIn,
    tokenOut,
    tickSpacing,
    amountIn,
    sqrtPriceLimitX96,
  };

  const quote = await quoterContract.quoteExactInputSingle.staticCall(params, {});
  console.table({
    amountIn,
    sqrtPriceX96After: quote.sqrtPriceX96After,
    amountOut: quote.amountOut,
    initializedTicksCrossed: quote.initializedTicksCrossed,
    gasEstimate: quote.gasEstimate,
  });
}

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
  const aeroBond = await AeroBond.deploy(deployer.address, deployer.address, 5000, M_ETH_ADDRESS, true);
  const treasuryAddress = await aeroBond.treasury();
  const ownerAddress = await aeroBond.manager();
  console.log(`AeroBond Address: ${await aeroBond.getAddress()}`);
  console.log(`Treasury Address: ${treasuryAddress}`);
  console.log(`Owner Address: ${ownerAddress}`);
  console.log(`Current Deployer Address: ${deployer.address}`);
  return { aeroBond, deployer, buyer };
}

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

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

  describe("mEthToken", function () {
    it("should init and mint position", async function () {
      const { deployer, aeroBond } = await loadFixture(deployAeroBondFixture);
      const wethContract = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", WETH_ADDRESS)).connect(deployer) as unknown as IWETH;
      const methContract = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", M_ETH_ADDRESS)).connect(
        deployer
      ) as unknown as IERC20;
      await initAeroBondForMethToken(await aeroBond.getAddress());
      await initNftLiquidityPosition(deployer, WETH_M_ETH_CL_POOL_ADDRESS, 10);

      await wethContract.approve(WETH_M_ETH_CL_POOL_ADDRESS, ethers.parseEther("10"));
      await methContract.approve(WETH_M_ETH_CL_POOL_ADDRESS, ethers.parseEther("10"));

      for (const amountIn of ["8", "8.1", "8.18", "8.2"]) {
        await getQuote(deployer, {
          amountIn: ethers.parseEther(amountIn),
          tokenIn: WETH_ADDRESS,
          tokenOut: M_ETH_ADDRESS,
        });
      }

      // await swap({
      //   signer: deployer,
      //   amountIn: ethers.parseEther("8.2"),
      //   paths: [WETH_ADDRESS, 1, M_ETH_ADDRESS],
      //   recipient: deployer.address,
      //   amountOutMin: 0n,
      //   payerIsUser: true,
      //   log: true,
      //   isRebalance: false,
      //   testName: "initNftLiquidityPosition",
      //   isV3: true,
      // });
    }).timeout(1000000);
  });
});
