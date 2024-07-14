import hre, { ethers } from "hardhat";
import { IAeroPool, IAeroPool__factory, IERC20, IRouter, IWETH } from "../../typechain-types";
import { REGEN_WHALE, REGEN_ADDRESS, TEST_TOKEN_ADDRESS, TEST_TOKEN_MINTER } from "./constants";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { getSwapExpected } from "../utils/trading";
import { AddressLike, resolveAddress } from "ethers";
import { impersonateAccount, stopImpersonation } from "../utils/hardhat";

/**
 * Initialize the AeroBond contract with 10000000 or tknAmount of REGEN tokens
 * @param aeroBondAddress The address of the AeroBond contract
 * @param tknAmount The amount of REGEN tokens to deposit
 * @returns The starting balance of REGEN tokens
 */
export async function initAeroBond(aeroBondAddress: string, tknAmount: number = 10000000) {
  await impersonateAccount(REGEN_WHALE);

  const regenContract = (await hre.ethers.getContractAt("contracts/IERC20.sol:IERC20", REGEN_ADDRESS)) as unknown as IERC20;
  const regenWhaleSigner = await ethers.getSigner(REGEN_WHALE);
  await regenContract.connect(regenWhaleSigner).transfer(aeroBondAddress, ethers.parseEther(tknAmount.toString()));
  const startingRegenBalance = await regenContract.balanceOf(aeroBondAddress);
  await stopImpersonation(REGEN_WHALE);
  return { startingRegenBalance, regenContract };
}

export async function initAeroBondForTestToken(aeroBondAddress: string, tknAmount: number = 100) {
  await impersonateAccount(TEST_TOKEN_MINTER);
  const testToken = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", TEST_TOKEN_ADDRESS)) as unknown as IERC20;
  await impersonateAccount(TEST_TOKEN_MINTER);
  await hre.network.provider.send("hardhat_setBalance", [
    TEST_TOKEN_MINTER,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);
  const testTokenMinterSigner = await ethers.getSigner(TEST_TOKEN_MINTER);
  await testToken.connect(testTokenMinterSigner).mint(aeroBondAddress, ethers.parseEther(tknAmount.toString()));
  const startingTestTokenBalance = await testToken.balanceOf(aeroBondAddress);
  console.log(`Test token balance: ${startingTestTokenBalance}`);
  await stopImpersonation(TEST_TOKEN_MINTER);
  return { startingTestTokenBalance, testToken };
}

async function getReserves(
  deployerAeroRouter: IAeroPool,
  {
    from,
    to,
    stable,
    log = false,
  }: {
    from: AddressLike;
    to: AddressLike;
    stable: boolean;
    log?: boolean;
  }
) {
  const foo: IRouter.RouteStruct = {
    factory: await deployerAeroRouter.defaultFactory(),
    from: from,
    to: to,
    stable: stable,
  };
  const reserves = await deployerAeroRouter.getReserves(from, to, stable, foo.factory);
  if (log) {
    console.log("Reserves:");
    console.table({
      WETH: ethers.formatEther(reserves[0]),
      TEST_TOKEN: ethers.formatEther(reserves[1]),
    });
  }
  return {
    from: reserves[0],
    to: reserves[1],
  };
}

export async function poolStats(
  deployer: HardhatEthersSigner,
  pool: AddressLike,
  {
    from,
    to,
    stable,
    proposedSwapAmount,
    logReserves = false,
    logSwapExpected = false,
  }: {
    from: AddressLike;
    to: AddressLike;
    stable: boolean;
    proposedSwapAmount: bigint;
    logReserves?: boolean;
    logSwapExpected?: boolean;
  }
) {
  const aeroPool = IAeroPool__factory.connect(await resolveAddress(pool));
  const deployerAeroRouter = aeroPool.connect(deployer);

  const swapExpected = await getSwapExpected(deployerAeroRouter, {
    from,
    to,
    stable,
    amount: proposedSwapAmount,
    log: logSwapExpected,
  });
  const reserves = await getReserves(deployerAeroRouter, {
    from,
    to,
    stable,
    log: logReserves,
  });

  return {
    swapExpected,
    reserves,
  };
}
