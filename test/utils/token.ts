import { impersonateAccount } from "@nomicfoundation/hardhat-network-helpers";
import hre, { ethers } from "hardhat";
import { IERC20, IWETH } from "../../typechain-types";
import { M_ETH_ADDRESS, M_ETH_OWNER_ADDRESS } from "../aerobond/constants";
import { stopImpersonation } from "./hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export async function fundMeth(addressToFund: string, amount: number) {
  const methContract = (await ethers.getContractAt("contracts/IERC20.sol:IERC20", M_ETH_ADDRESS)) as unknown as IERC20;
  await impersonateAccount(M_ETH_OWNER_ADDRESS);
  const methOwnerSigner = await ethers.getSigner(M_ETH_OWNER_ADDRESS);
  await methContract.connect(methOwnerSigner).mint(addressToFund, ethers.parseEther(amount.toString()));
  await stopImpersonation(M_ETH_OWNER_ADDRESS);
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
