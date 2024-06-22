import hre, { ethers } from "hardhat";
import {
  IAeroPool,
  IAeroPool__factory,
  IERC20,
  IRouter,
  IUniveralRouter,
  IWETH,
} from "../../typechain-types";
import {
  REGEN_WHALE,
  REGEN_ADDRESS,
  TEST_TOKEN_ADDRESS,
  TEST_TOKEN_MINTER,
} from "./constants";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { encodeSwapParams } from "../utils/Router";
import { AddressLike, resolveAddress } from "ethers";

async function impersonateAccount(address: string) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [address],
  });
}

async function stopImpersonation(address: string) {
  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [address],
  });
}

/**
 * Initialize the AeroBond contract with 10000000 or tknAmount of REGEN tokens
 * @param aeroBondAddress The address of the AeroBond contract
 * @param tknAmount The amount of REGEN tokens to deposit
 * @returns The starting balance of REGEN tokens
 */
export async function initAeroBond(
  aeroBondAddress: string,
  tknAmount: number = 10000000
) {
  await impersonateAccount(REGEN_WHALE);

  const regenContract = (await hre.ethers.getContractAt(
    "contracts/IERC20.sol:IERC20",
    REGEN_ADDRESS
  )) as unknown as IERC20;
  const regenWhaleSigner = await ethers.getSigner(REGEN_WHALE);
  await regenContract
    .connect(regenWhaleSigner)
    .transfer(aeroBondAddress, ethers.parseEther(tknAmount.toString()));
  const startingRegenBalance = await regenContract.balanceOf(aeroBondAddress);
  await stopImpersonation(REGEN_WHALE);
  return { startingRegenBalance, regenContract };
}

export async function initAeroBondForTestToken(
  aeroBondAddress: string,
  tknAmount: number = 100
) {
  await impersonateAccount(TEST_TOKEN_MINTER);
  const testToken = (await ethers.getContractAt(
    "contracts/IERC20.sol:IERC20",
    TEST_TOKEN_ADDRESS
  )) as unknown as IERC20;
  await impersonateAccount(TEST_TOKEN_MINTER);
  await hre.network.provider.send("hardhat_setBalance", [
    TEST_TOKEN_MINTER,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);
  const testTokenMinterSigner = await ethers.getSigner(TEST_TOKEN_MINTER);
  await testToken
    .connect(testTokenMinterSigner)
    .mint(aeroBondAddress, ethers.parseEther(tknAmount.toString()));
  const startingTestTokenBalance = await testToken.balanceOf(aeroBondAddress);
  console.log(`Test token balance: ${startingTestTokenBalance}`);
  await stopImpersonation(TEST_TOKEN_MINTER);
  return { startingTestTokenBalance, testToken };
}

export async function fundWeth(
  wethAddress: string,
  signerToReceive: HardhatEthersSigner,
  amount: number
) {
  const wethAmount = ethers.parseEther(amount.toString());
  // Fund the deployer with WETH
  await hre.network.provider.send("hardhat_setBalance", [
    signerToReceive.address,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);

  // Approve the AeroBond contract to spend WETH
  const weth = (await ethers.getContractAt(
    "contracts/IWETH.sol:IWETH",
    wethAddress
  )) as unknown as IWETH;
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
    console.log(
      `Depositing ${ethers.formatEther(amount)} WETH to ${targetAddress}`
    );
  }
  await cb(amount);
}

export async function swap({
  signer,
  from,
  to,
  amount,
  minOut,
  stable,
  log = false,
}: {
  signer: HardhatEthersSigner;
  from: IERC20 | IWETH;
  to: IERC20 | IWETH;
  amount: bigint;
  minOut: bigint;
  stable: boolean;
  log: boolean;
}) {
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

  const encodedSwapParams = encodeSwapParams({
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

  const aeroRouterAddress = await aeroRouter.getAddress();
  from.connect(signer).approve(aeroRouterAddress, amount);
  const tx = await aeroRouter
    .connect(signer)
    ["execute(bytes,bytes[])"]("0x08", [encodedSwapParams]);
  if (log) {
    console.log(`Swapping ${fromTokenName} to ${toTokenName}`);
  }

  const fromTokenAfterSwap = await from.balanceOf(signer.address);
  const toTokenAfterSwap = await to.balanceOf(signer.address);

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

const percentFormatter = (num: number) => `${(num * 100).toFixed(2)}%`;

async function getSwapExpected(
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
  const numOfSwapExpected = Number.parseFloat(
    ethers.formatEther(swapExpected[1])
  );
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
  const reserves = await deployerAeroRouter.getReserves(
    from,
    to,
    stable,
    foo.factory
  );
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
    logReserves: boolean;
    logSwapExpected: boolean;
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
