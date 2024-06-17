import {
  impersonateAccount,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";
import {
  IERC20,
  IUniveralRouter__factory,
  IUniveralRouter,
  IWETH,
} from "../../typechain-types";
import {
  REGEN_ADDRESS,
  REGEN_WHALE,
  TEST_TOKEN_ADDRESS,
  TEST_TOKEN_MINTER,
  WETH_ADDRESS,
} from "./constants";
import {
  depositWeth,
  fundWeth,
  initAeroBond,
  initAeroBondForTestToken,
} from "./AeroBondInteractions";
import { encodeSwapParams } from "../utils/Router";

function createAeroBondFixture(tokenAddress: string) {
  async function deployAeroBondFixture() {
    const [deployer, buyer] = await ethers.getSigners();
    // Minting ETH to the deployer's wallet for testing purposes
    await hre.network.provider.send("hardhat_setBalance", [
      deployer.address,
      "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
    ]);
    const AeroBond = await ethers.getContractFactory("AeroBond");
    const aerodromeRouterAddress = "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43"; // Aerodrome Router address
    const aeroBond = await AeroBond.deploy(
      deployer.address,
      deployer.address,
      5000,
      tokenAddress
    );
    const treasuryAddress = await aeroBond.treasury();
    const ownerAddress = await aeroBond.manager();
    console.log(`AeroBond Address: ${await aeroBond.getAddress()}`);
    console.log(`Treasury Address: ${treasuryAddress}`);
    console.log(`Owner Address: ${ownerAddress}`);
    console.log(`Current Deployer Address: ${deployer.address}`);
    return { aeroBond, deployer, buyer };
  }
  return deployAeroBondFixture;
}

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

const deployRegenAeroBondFixture = createAeroBondFixture(REGEN_ADDRESS);

describe("AeroBond", function () {
  describe("Deployment", function () {
    it("should set the correct treasury and manager addresses", async function () {
      const { aeroBond, deployer } = await loadFixture(
        deployRegenAeroBondFixture
      );
      const treasuryAddress = await aeroBond.treasury();
      const managerAddress = await aeroBond.manager();

      expect(treasuryAddress).to.equal(deployer.address);
      expect(managerAddress).to.equal(deployer.address);
    });
  });

  describe("Deposit", function () {
    context("when the user has enough WETH balance", function () {
      it("should allow the user to deposit WETH and receive LP tokens", async function () {
        const { aeroBond, deployer } = await loadFixture(
          deployRegenAeroBondFixture
        );
        const aeroBondAddress = await aeroBond.getAddress();

        const { startingRegenBalance, regenContract } = await initAeroBond(
          aeroBondAddress
        );

        const wethAmount = ethers.parseEther("10");
        // Fund the deployer with WETH
        const weth = await fundWeth(WETH_ADDRESS, deployer.address, 10);
        expect(await weth.balanceOf(deployer.address)).to.be.greaterThan(0);
        await depositWeth(
          deployer,
          weth,
          wethAmount,
          aeroBondAddress,
          async (amount: bigint) => {
            await aeroBond.connect(deployer).deposit(amount);
          }
        );
        const regenBalanceAfterDeposit = await regenContract.balanceOf(
          aeroBondAddress
        );
        console.log(
          `Amount of regen deposited: ${ethers.formatEther(
            startingRegenBalance - regenBalanceAfterDeposit
          )}`
        );

        expect(await weth.balanceOf(deployer.address)).to.be.eq(0);
        expect(await regenContract.balanceOf(aeroBondAddress)).to.be.lt(
          startingRegenBalance
        );
      });
    });

    context("when the user does not have enough WETH balance", function () {
      it("should revert the transaction", async function () {
        const { aeroBond, deployer } = await loadFixture(
          deployRegenAeroBondFixture
        );
        const wethAmount = ethers.parseEther("10");
        const aeroBondAddress = await aeroBond.getAddress();

        // Approve the AeroBond contract to spend WETH
        const weth = (await ethers.getContractAt(
          "contracts/IERC20.sol:IERC20",
          WETH_ADDRESS
        )) as unknown as IERC20;
        await weth.connect(deployer).approve(aeroBondAddress, wethAmount);

        // Attempt to deposit WETH without funding the deployer
        await expect(
          aeroBond.connect(deployer).deposit(wethAmount)
        ).to.be.revertedWithoutReason();
      });
    });
  });

  describe("Withdraw", function () {
    it("should allow the user to deposit and withdraw tokens", async function () {
      const { aeroBond, deployer } = await loadFixture(
        deployRegenAeroBondFixture
      );
      const aeroBondAddress = await aeroBond.getAddress();
      const { startingRegenBalance, regenContract } = await initAeroBond(
        aeroBondAddress
      );

      const wethAmount = ethers.parseEther("10");
      // Fund the deployer with WETH
      const weth = await fundWeth(WETH_ADDRESS, deployer.address, 10);
      const deployerWethBalance = await weth.balanceOf(deployer.address);
      expect(deployerWethBalance).to.be.greaterThan(0);
      console.log(
        `Deployer WETH balance before deposit: ${ethers.formatEther(
          deployerWethBalance
        )}`
      );
      console.log(
        `regen balance of deployer before deposit: ${ethers.formatEther(
          await regenContract.balanceOf(deployer.address)
        )}`
      );

      await depositWeth(
        deployer,
        weth,
        wethAmount,
        aeroBondAddress,
        async (amount: bigint) => {
          await aeroBond.connect(deployer).deposit(amount);
        }
      );
      const deployerWethBalanceAfterDeposit = await weth.balanceOf(
        deployer.address
      );
      console.log(
        `Deployer WETH balance after deposit: ${ethers.formatEther(
          deployerWethBalanceAfterDeposit
        )}`
      );

      const regenBalanceOfDeployerAfterDeposit = await regenContract.balanceOf(
        deployer.address
      );
      expect(regenBalanceOfDeployerAfterDeposit).to.be.gt(0);

      const regenBalanceOfAeroBondAfterDeposit = await regenContract.balanceOf(
        aeroBondAddress
      );
      expect(startingRegenBalance).to.be.gt(regenBalanceOfAeroBondAfterDeposit);

      console.log(
        `Regen balance of deployer after deposit: ${ethers.formatEther(
          regenBalanceOfDeployerAfterDeposit
        )}`
      );
      console.log(
        `Regen balance of AeroBond after deposit: ${ethers.formatEther(
          regenBalanceOfAeroBondAfterDeposit
        )}`
      );
    });
  });

  const deployTestTokenAeroBondFixture =
    createAeroBondFixture(TEST_TOKEN_ADDRESS);

  describe("TestToken", function () {
    it("should allow the user to mint tokens", async function () {
      const { aeroBond, deployer } = await loadFixture(
        deployTestTokenAeroBondFixture
      );
      const wethAmount = ethers.parseEther("1");
      const weth = await fundWeth(WETH_ADDRESS, deployer.address, 10);

      const aeroBondAddress = await aeroBond.getAddress();
      const { startingTestTokenBalance, testToken } =
        await initAeroBondForTestToken(aeroBondAddress);
      console.log(
        `Starting test token balance: ${ethers.formatEther(
          startingTestTokenBalance
        )}`
      );
      await depositWeth(
        deployer,
        weth,
        wethAmount,
        aeroBondAddress,
        async (amount: bigint) => {
          await aeroBond.connect(deployer).deposit(amount);
        }
      );
      expect(startingTestTokenBalance).to.be.greaterThan(0);
      // const aeroRouter = IUniveralRouter__factory.connect(
      //   "0x6Cb442acF35158D5eDa88fe602221b67B400Be3E"
      // );
      const aeroRouter = (await ethers.getContractAt(
        "contracts/IUniversalRouter.sol:IUniveralRouter",
        "0x6Cb442acF35158D5eDa88fe602221b67B400Be3E"
      )) as unknown as IUniveralRouter;

      const encodedSwapParams = encodeSwapParams({
        from: "0x93798Ef7e3A621d7C4EfF22eDA50B931fE57a3cF",
        amount: 10000000000n,
        minOut: 9968009189n,
        routes: [
          {
            fromTokenAddress: "0xdce97DAd5335AeCbFA7410eE87cea9f6411a632f",
            toTokenAddress: "0x4200000000000000000000000000000000000006",
            stable: false,
          },
        ],
        payerIsUser: true,
      });

      const aeroRouterAddress = await aeroRouter.getAddress();
      testToken.connect(deployer).approve(aeroRouterAddress, 10000000000n);
      const tx = await aeroRouter
        .connect(deployer)
        ["execute(bytes,bytes[])"]("0x08", [encodedSwapParams]);
      console.log("OH WE SWAPPED!");
    });
  });
});
