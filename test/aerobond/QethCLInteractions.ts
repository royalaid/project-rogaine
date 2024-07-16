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
import { getSwapExpected, swap } from "../utils/trading";
import { AddressLike, resolveAddress } from "ethers";
import { calculatePriceFromSqrtPriceX96, calculateSqrtPriceX96 } from "../utils/bigintMath";
import { Pool, Position, nearestUsableTick } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";
import { impersonateAccount } from "@nomicfoundation/hardhat-network-helpers";
import { stopImpersonation } from "../utils/hardhat";
import { fundWeth } from "../utils/token";

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
  const wethContract = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", WETH_ADDRESS)).connect(signer) as unknown as IERC20;
  const methContract = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", M_ETH_ADDRESS)).connect(signer) as unknown as IERC20;

  const nftPosManager = (
    await ethers.getContractAt("contracts/INFPositionManager.sol:INFPostionManager", AERO_NFT_POS_MANAGER_ADDRESS)
  ).connect(signer) as unknown as INFPostionManager;

  const sugarContract = (await ethers.getContractAt(
    "contracts/IAeroSugarHelper.sol:IAeroSugarHelper",
    AERO_SUGAR_HELPER_ADDRESS
  )) as unknown as IAeroSugarHelper;

  const clAeroPool = (await ethers.getContractAt("contracts/ICLPool.sol:ICLPool", poolAddress)) as unknown as ICLPool;
  const startingPoolWethBalance = await wethContract.balanceOf(poolAddress);
  const startingPoolMethBalance = await methContract.balanceOf(poolAddress);

  const slot0 = await clAeroPool.slot0();
  const sqrtPriceX96 = slot0.sqrtPriceX96;
  const fee = await clAeroPool.fee();
  const liquidity = await clAeroPool.liquidity();

  const tick = await sugarContract.getTickAtSqrtRatio(slot0.sqrtPriceX96);
  const tickLower = tick - 1n;
  const tickUpper = tick + 1n;

  await fundWeth(WETH_ADDRESS, signer, 100);
  await fundMeth(signer.address, 100);

  const params: MintParamsStruct = {
    token0: WETH_ADDRESS,
    token1: M_ETH_ADDRESS,
    amount0Desired: ethers.parseEther(tknAmount.toString()),
    amount1Desired: ethers.parseEther(tknAmount.toString()),
    amount0Min: 0n,
    amount1Min: 0n,
    tickSpacing: 1,
    tickLower: -1,
    tickUpper: 1,
    recipient: signer.address,
    deadline: Date.now() + 1000000,
    sqrtPriceX96: 0n,
  };
  console.table(params);

  await wethContract.approve(AERO_NFT_POS_MANAGER_ADDRESS, ethers.parseEther(tknAmount.toString()));
  await methContract.approve(AERO_NFT_POS_MANAGER_ADDRESS, ethers.parseEther(tknAmount.toString()));

  await nftPosManager.mint(params);
  const posId = await nftPosManager.tokenOfOwnerByIndex(signer.address, 0);
  const pos = await nftPosManager.positions(posId);
  console.table({
    token0: pos.token0,
    token1: pos.token1,
    liquidity: pos.liquidity,
  });
  const newPoolWethBalance = await wethContract.balanceOf(poolAddress);
  const newPoolMethBalance = await methContract.balanceOf(poolAddress);
  console.table({
    startingPoolWethBalance,
    newPoolWethBalance,
    startingPoolMethBalance,
    newPoolMethBalance,
  });

  const newLiquidity = await clAeroPool.liquidity();
  const newSqrtPriceX96 = (await clAeroPool.slot0()).sqrtPriceX96;

  console.log(`Old liquidity: ${liquidity}`);
  console.log(`New liquidity: ${newLiquidity}`);

  console.log(`Old sqrtPriceX96: ${sqrtPriceX96}`);
  console.log(`New sqrtPriceX96: ${newSqrtPriceX96}`);
  console.log("Self Address", signer.address);
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
