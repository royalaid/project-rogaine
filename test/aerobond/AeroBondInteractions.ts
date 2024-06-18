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
  addressToReceive: string,
  amount: number
) {
  const wethAmount = ethers.parseEther("10");
  // Fund the deployer with WETH
  await hre.network.provider.send("hardhat_setBalance", [
    addressToReceive,
    "0x3635C9ADC5DEA00000", // 1000 ETH in hexadecimal
  ]);

  // Approve the AeroBond contract to spend WETH
  const weth = (await ethers.getContractAt(
    "contracts/IWETH.sol:IWETH",
    wethAddress
  )) as unknown as IWETH;
  await weth.deposit({ value: wethAmount });
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
  if (amount > (await curWalletWeth.balanceOf(singer.address))) {
    throw new Error("Not enough balance");
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
}: {
  signer: HardhatEthersSigner;
  from: IERC20 | IWETH;
  to: IERC20;
  amount: bigint;
  minOut: bigint;
}) {
  const aeroRouter = (await ethers.getContractAt(
    "contracts/IUniversalRouter.sol:IUniveralRouter",
    "0x6Cb442acF35158D5eDa88fe602221b67B400Be3E"
  )) as unknown as IUniveralRouter;
  const fromAddress = await from.getAddress();
  const toAddress = await to.getAddress();

  const encodedSwapParams = encodeSwapParams({
    from: signer.address,
    amount: amount,
    minOut: minOut,
    routes: [
      {
        fromTokenAddress: fromAddress,
        toTokenAddress: toAddress,
        stable: false,
      },
    ],
    payerIsUser: true,
  });

  const aeroRouterAddress = await aeroRouter.getAddress();
  from.connect(signer).approve(aeroRouterAddress, amount);
  const tx = await aeroRouter
    .connect(signer)
    ["execute(bytes,bytes[])"]("0x08", [encodedSwapParams]);
  console.log("OH WE SWAPPED!");
}

async function getSwapExpected(
  deployerAeroRouter: IAeroPool,
  { from, to }: { from: AddressLike; to: AddressLike }
) {
  const foo: IRouter.RouteStruct = {
    factory: await deployerAeroRouter.defaultFactory(),
    from: from,
    to: to,
    stable: false,
  };
  const swapExpected = await deployerAeroRouter.getAmountsOut(
    ethers.parseEther("100"),
    [foo]
  );
  return swapExpected;
}

async function getReserves(
  deployerAeroRouter: IAeroPool,
  {
    from,
    to,
  }: {
    from: AddressLike;
    to: AddressLike;
  }
) {
  const foo: IRouter.RouteStruct = {
    factory: await deployerAeroRouter.defaultFactory(),
    from: from,
    to: to,
    stable: false,
  };
  const reserves = await deployerAeroRouter.getReserves(
    from,
    to,
    false,
    foo.factory
  );
  return reserves;
}

export async function poolStats(
  deployer: HardhatEthersSigner,
  pool: AddressLike,
  { from, to }: { from: AddressLike; to: AddressLike }
) {
  const aeroPool = IAeroPool__factory.connect(await resolveAddress(pool));
  const deployerAeroRouter = aeroPool.connect(deployer);

  const swapExpected = await getSwapExpected(deployerAeroRouter, {
    from,
    to,
  });
  const reserves = await getReserves(deployerAeroRouter, {
    from,
    to,
  });

  console.log("Expected swap:");
  console.table({
    WETH: ethers.formatEther(swapExpected[0]),
    TEST_TOKEN: ethers.formatEther(swapExpected[1]),
  });
  console.log("Reserves:");
  console.table({
    WETH: ethers.formatEther(reserves[0]),
    TEST_TOKEN: ethers.formatEther(reserves[1]),
  });
}
