import { ethers } from "hardhat";
import { IAeroPool, IERC20, IRouter, IUniveralRouter, IWETH } from "../../typechain-types";
import { encodeV2SwapParams, encodeV3SwapParams } from "./Router";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { AbiCoder, AddressLike } from "ethers";
import { TEST_TOKEN_WETH_AERO_POOL_ADDRESS, percentFormatter } from "../aerobond/constants";
import { poolStats } from "../aerobond/AeroBondInteractions";
import path from "path";

const swapRecords: {
  from: AddressLike;
  fromAmt: bigint;
  fromReserves?: bigint;
  to: AddressLike;
  toAmt: bigint;
  toReserves?: bigint;
  slippage: number;
  file: string;
  line: number;
  isRebalance: boolean;
  testName: string;
}[] = [];

export const getSwapRecords = () => swapRecords;

export function initSwapRecords() {
  swapRecords.length = 0;
}

export async function getSwapExpected(
  deployerAeroRouter: IAeroPool,
  {
    from,
    to,
    stable,
    amount,
    log = false,
  }: {
    from: AddressLike;
    to: AddressLike;
    stable: boolean;
    amount: bigint;
    log?: boolean;
  }
) {
  const foo: IRouter.RouteStruct = {
    factory: await deployerAeroRouter.defaultFactory(),
    from: from,
    to: to,
    stable: stable,
  };
  const swapExpected = await deployerAeroRouter.getAmountsOut(amount, [foo]);
  const numOfSwapExpected = Number.parseFloat(ethers.formatEther(swapExpected[1]));
  const numOfAmount = Number.parseFloat(ethers.formatEther(amount));
  const slippage = (numOfSwapExpected - numOfAmount) / numOfAmount;
  if (log) {
    console.log("Expected swap:");
    console.table({
      WETH: ethers.formatEther(swapExpected[0]),
      TEST_TOKEN: ethers.formatEther(swapExpected[1]),
      Slippage: percentFormatter(Number(slippage)),
    });
  }
  return {
    from: swapExpected[0],
    to: swapExpected[1],
  };
}

type SwapParamsV2 = {
  isV3?: false;
  signer: HardhatEthersSigner;
  from: IERC20 | IWETH;
  to: IERC20 | IWETH;
  amount: bigint;
  minOut: bigint;
  stable: boolean;
  log: boolean;
  isRebalance: boolean;
  testName: string;
};

type SwapParamsV3 = {
  isV3: true;
  signer: HardhatEthersSigner;
  recipient: AddressLike;
  amountIn: bigint;
  amountOutMin: bigint;
  payerIsUser: boolean;
  paths: [string, number, string];
  log: boolean;
  testName: string;
  isRebalance: boolean;
};

type SwapParams = SwapParamsV2 | SwapParamsV3;

export async function swap(params: SwapParams) {
  if (params.isV3) {
    return swapV3(params);
  }
  return swapV2(params);
}

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

export async function swapV3({ signer, amountIn, paths, log = false, testName, isRebalance = false }: SwapParamsV3) {
  const aeroRouter = (await ethers.getContractAt(
    "contracts/IUniversalRouter.sol:IUniveralRouter",
    "0x6Cb442acF35158D5eDa88fe602221b67B400Be3E"
  )) as unknown as IUniveralRouter;
  const fromAddress = paths[0];
  const toAddress = paths[2];
  const from = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", fromAddress)) as unknown as IERC20;
  const fee = paths[1];
  const to = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", toAddress)) as unknown as IERC20;

  const fromTokenName = await from.symbol();
  const toTokenName = await to.symbol();

  const fromTokenBeforeSwap = await from.balanceOf(signer.address);
  const toTokenBeforeSwap = await to.balanceOf(signer.address);

  const encodedSwapParams = encodeV3SwapParams({
    recipient: signer.address,
    amountIn,
    amountOutMinimum: 0n,
    path: paths,
    payerIsUser: true,
  });
  // const { reserves } = await poolStats(signer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
  //   from: fromAddress,
  //   to: toAddress,
  //   stable: false,
  //   logReserves: false,
  //   logSwapExpected: false,
  //   proposedSwapAmount: ethers.parseEther("10"),
  // });

  const aeroRouterAddress = await aeroRouter.getAddress();
  typeof from === "string"
    ? await signer.sendTransaction({
        to: fromAddress,
        value: amountIn,
      })
    : await from.connect(signer).approve(aeroRouterAddress, amountIn);
  const tx = await aeroRouter.connect(signer)["execute(bytes,bytes[])"]("0x00", [encodedSwapParams]);
  if (log) {
    console.log(`Swapping ${fromTokenName} to ${toTokenName}`);
  }

  const fromTokenAfterSwap = typeof from === "string" ? -1n : await from.balanceOf(signer.address);
  const toTokenAfterSwap = typeof to === "string" ? -1n : await to.balanceOf(signer.address);

  const stack = new Error().stack;
  const stackLine = stack?.split("\n")[2]; // Adjust the index if necessary
  const match = stackLine?.match(/\((.*):(\d+):\d+\)/);
  const fullPath = match ? match[1] : "unknown";
  const file = path.basename(fullPath);
  const line = match ? parseInt(match[2], 10) : -1;

  swapRecords.push({
    file,
    line,
    from: fromAddress,
    fromAmt: amountIn,
    // fromReserves: reserves.from,
    to: toAddress,
    toAmt: toTokenAfterSwap - toTokenBeforeSwap,
    // toReserves: reserves.to,
    slippage: Number(ethers.formatEther(toTokenAfterSwap - toTokenBeforeSwap)) / Number(ethers.formatEther(amountIn)) - 1,
    testName,
    isRebalance,
  });

  if (log) {
    console.log(`${fromTokenName} Before/After Swap`);
    console.table({
      Before: ethers.formatEther(fromTokenBeforeSwap),
      After: ethers.formatEther(fromTokenAfterSwap),
    });
  }

  if (log) {
    console.log(`${toTokenName} Before/After Swap`);
    console.table({
      Before: ethers.formatEther(toTokenBeforeSwap),
      After: ethers.formatEther(toTokenAfterSwap),
    });
  }
}

export async function swapV2({ signer, from, to, amount, minOut, stable, log = false, isRebalance = false, testName }: SwapParamsV2) {
  const aeroRouter = (await ethers.getContractAt(
    "contracts/IUniversalRouter.sol:IUniveralRouter",
    "0x6Cb442acF35158D5eDa88fe602221b67B400Be3E"
  )) as unknown as IUniveralRouter;
  const fromAddress = await from.getAddress();
  const toAddress = await to.getAddress();
  const fromTokenName = await from.symbol();
  const toTokenName = await to.symbol();

  const fromTokenBeforeSwap = await from.balanceOf(signer.address);
  const toTokenBeforeSwap = await to.balanceOf(signer.address);

  const encodedSwapParams = encodeV2SwapParams({
    from: signer.address,
    amount: amount,
    minOut: minOut,
    routes: [
      {
        fromTokenAddress: fromAddress,
        toTokenAddress: toAddress,
        stable: stable,
      },
    ],
    payerIsUser: true,
  });

  const { reserves } = await poolStats(signer, TEST_TOKEN_WETH_AERO_POOL_ADDRESS, {
    from: fromAddress,
    to: toAddress,
    stable,
    logReserves: false,
    logSwapExpected: false,
    proposedSwapAmount: ethers.parseEther("10"),
  });

  const aeroRouterAddress = await aeroRouter.getAddress();
  typeof from === "string"
    ? await signer.sendTransaction({
        to: fromAddress,
        value: amount,
      })
    : await from.connect(signer).approve(aeroRouterAddress, amount);
  const tx = await aeroRouter.connect(signer)["execute(bytes,bytes[])"]("0x08", [encodedSwapParams]);
  if (log) {
    console.log(`Swapping ${fromTokenName} to ${toTokenName}`);
  }

  const fromTokenAfterSwap = typeof from === "string" ? -1n : await from.balanceOf(signer.address);
  const toTokenAfterSwap = typeof to === "string" ? -1n : await to.balanceOf(signer.address);

  const stack = new Error().stack;
  const stackLine = stack?.split("\n")[2]; // Adjust the index if necessary
  const match = stackLine?.match(/\((.*):(\d+):\d+\)/);
  const fullPath = match ? match[1] : "unknown";
  const file = path.basename(fullPath);
  const line = match ? parseInt(match[2], 10) : -1;

  swapRecords.push({
    file,
    line,
    from: fromAddress,
    fromAmt: amount,
    fromReserves: reserves.from,
    to: toAddress,
    toAmt: toTokenAfterSwap - toTokenBeforeSwap,
    toReserves: reserves.to,
    slippage: Number(ethers.formatEther(toTokenAfterSwap - toTokenBeforeSwap)) / Number(ethers.formatEther(amount)) - 1,
    testName,
    isRebalance,
  });

  if (log) {
    console.log(`${fromTokenName} Before/After Swap`);
    console.table({
      Before: ethers.formatEther(fromTokenBeforeSwap),
      After: ethers.formatEther(fromTokenAfterSwap),
    });
  }

  if (log) {
    console.log(`${toTokenName} Before/After Swap`);
    console.table({
      Before: ethers.formatEther(toTokenBeforeSwap),
      After: ethers.formatEther(toTokenAfterSwap),
    });
  }
}
