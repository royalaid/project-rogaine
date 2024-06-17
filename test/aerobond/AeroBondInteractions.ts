import hre, { ethers } from "hardhat";
import { IERC20, IWETH } from "../../typechain-types";
import {
  REGEN_WHALE,
  REGEN_ADDRESS,
  TEST_TOKEN_ADDRESS,
  TEST_TOKEN_MINTER,
} from "./constants";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

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
