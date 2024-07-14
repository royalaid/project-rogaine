import hre, { ethers } from "hardhat";
import {
  IAeroPool,
  IAeroPool__factory,
  IERC20,
  IRouter,
  IWETH,
  INFPostionManager,
  INFPostionManager__factory,
  ICLPool__factory,
  ICLPool,
  IAeroSugarHelper,
} from "../../typechain-types";
import { INonfungiblePositionManager } from "../../typechain-types/contracts/INFPositionManager.sol/INFPostionManager";
import MintParamsStruct = INonfungiblePositionManager.MintParamsStruct;
import {
  M_ETH_OWNER_ADDRESS,
  M_ETH_ADDRESS,
  WETH_M_ETH_CL_POOL_ADDRESS,
  AERO_NFT_POS_MANAGER_ADDRESS,
  WETH_ADDRESS,
  AERO_SUGAR_HELPER_ADDRESS,
} from "./constants";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { getSwapExpected } from "../utils/trading";
import { AddressLike, resolveAddress } from "ethers";
import { calculatePriceFromSqrtPriceX96, calculateSqrtPriceX96 } from "../utils/bigintMath";
import { Pool, Position, nearestUsableTick } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";
import { impersonateAccount } from "@nomicfoundation/hardhat-network-helpers";
import { stopImpersonation } from "../utils/hardhat";

export async function fundMeth(addressToFund: string, amount: number) {
  const methContract = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", M_ETH_ADDRESS)) as unknown as IERC20;
  await impersonateAccount(M_ETH_OWNER_ADDRESS);
  const methOwnerSigner = await ethers.getSigner(M_ETH_OWNER_ADDRESS);
  await methContract.connect(methOwnerSigner).mint(addressToFund, ethers.parseEther(amount.toString()));
  await stopImpersonation(M_ETH_OWNER_ADDRESS);
}

export async function initAeroBondForMethToken(aeroBondAddress: string, tknAmount: number = 100) {
  await impersonateAccount(M_ETH_OWNER_ADDRESS);
  await hre.network.provider.send("hardhat_setBalance", [
    M_ETH_OWNER_ADDRESS,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);
  const methContract = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", M_ETH_ADDRESS)) as unknown as IERC20;
  await fundMeth(aeroBondAddress, tknAmount);
  const startingMethBalance = await methContract.balanceOf(aeroBondAddress);
  console.log(`METH balance: ${ethers.formatEther(startingMethBalance)}`);
  await stopImpersonation(M_ETH_OWNER_ADDRESS);
  return { startingMethBalance, methContract };
}

export async function initNftLiquidityPosition(signer: HardhatEthersSigner, poolAddress: string, tknAmount: number = 100) {
  const wethContract = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", WETH_ADDRESS)) as unknown as IERC20;
  const methContract = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", M_ETH_ADDRESS)) as unknown as IERC20;

  const nftPosManager = (await ethers.getContractAt(
    "contracts/INFPositionManager.sol:INFPostionManager",
    AERO_NFT_POS_MANAGER_ADDRESS
  )) as unknown as INFPostionManager;

  const sugarContract = (await ethers.getContractAt(
    "contracts/IAeroSugarHelper.sol:IAeroSugarHelper",
    AERO_SUGAR_HELPER_ADDRESS
  )) as unknown as IAeroSugarHelper;

  const clAeroPool = (await ethers.getContractAt("contracts/ICLPool.sol:ICLPool", poolAddress)) as unknown as ICLPool;
  const slot0 = await clAeroPool.slot0();
  const sqrtPriceX96 = slot0.sqrtPriceX96;
  const liquidity = await clAeroPool.liquidity();
  const Q96 = 2n ** 96n;
  const reserve0 = (liquidity * Q96) / sqrtPriceX96;
  const reserve1 = (liquidity * sqrtPriceX96) / Q96;

  const amount0 = reserve0 / Q96;
  const amount1 = reserve1 / Q96;
  console.table({ reserve0, reserve1, amount0, amount1, Q96, sqrtPriceX96, liquidity });

  const tick = await sugarContract.getTickAtSqrtRatio(slot0.sqrtPriceX96);
  const tickLower = tick - 1n;
  const tickUpper = tick + 1n;
  const amount0Desired = ethers.parseEther("0.000438774693477425");
  const amount1Desired = amount0Desired;

  // console.table({ liquidity, tick, tickLower, tickUpper, amount0Desired, amount1Desired });

  //calculate tick for 1:1 ratio

  // console.log({ price: calculatePriceFromSqrtPriceX96(new Decimal(slot0.sqrtPriceX96.toString())) });
  // const half = new Decimal(slot0.sqrtPriceX96.toString()).div(new Decimal(2).sqrt());
  // console.log({ price: calculatePriceFromSqrtPriceX96(half) });
  // console.log({
  //   bigIntDiv: slot0.sqrtPriceX96 / 2n,
  //   rawDec: new Decimal(slot0.sqrtPriceX96.toString()),
  //   rawDiv: new Decimal(slot0.sqrtPriceX96.toString()).div(new Decimal(2).sqrt()),
  //   half: half,
  //   sugarTick: await sugarContract.getTickAtSqrtRatio(half.toFixed(0)),
  // });

  // sugarContract.getAmountsForLiquidity();

  await fundWeth(WETH_ADDRESS, signer, 100);
  await fundMeth(signer.address, 100);

  const params: MintParamsStruct = {
    token0: WETH_ADDRESS,
    token1: M_ETH_ADDRESS,
    amount0Desired: ethers.parseEther("1"),
    amount1Desired: ethers.parseEther("1"),
    amount0Min: 0n,
    amount1Min: 0n,
    tickSpacing: 1,
    tickLower: -2,
    tickUpper: 2,
    recipient: signer.address,
    deadline: Date.now() + 1000000,
    sqrtPriceX96: 0n,
  };
  console.table(params);

  await wethContract.connect(signer).approve(AERO_NFT_POS_MANAGER_ADDRESS, ethers.parseEther("1"));
  await methContract.connect(signer).approve(AERO_NFT_POS_MANAGER_ADDRESS, ethers.parseEther("1"));

  await nftPosManager.connect(signer).mint(params);

  const newLiquidity = await clAeroPool.liquidity();
  console.log(`New liquidity: ${ethers.formatEther(newLiquidity)}`);
}

export async function fundWeth(wethAddress: string, signerToReceive: HardhatEthersSigner, amount: number) {
  const wethAmount = ethers.parseEther(amount.toString());
  // Fund the deployer with WETH
  await hre.network.provider.send("hardhat_setBalance", [
    signerToReceive.address,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);

  // Approve the AeroBond contract to spend WETH
  const weth = (await ethers.getContractAt("contracts/IWETH.sol:IWETH", wethAddress)) as unknown as IWETH;
  await weth.connect(signerToReceive).deposit({ value: wethAmount });
  return weth;
}

export async function depositWeth(
  singer: HardhatEthersSigner,
  weth: IWETH,
  amount: bigint,
  targetAddress: string,
  cb: (amount: bigint) => Promise<void>
) {
  const curWalletWeth = weth.connect(singer);
  await curWalletWeth.approve(targetAddress, amount);
  const wethBalance = await curWalletWeth.balanceOf(singer.address);
  if (amount > wethBalance) {
    throw new Error(`Not enough balance: ${ethers.formatEther(wethBalance)}`);
  } else {
    console.log(`Depositing ${ethers.formatEther(amount)} WETH to ${targetAddress}`);
  }
  await cb(amount);
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
