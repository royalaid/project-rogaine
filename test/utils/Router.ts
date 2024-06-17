import { ethers } from "hardhat";

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

export type Route = {
  fromTokenAddress: string;
  toTokenAddress: string;
  stable: boolean;
};

export function encodeSwapParams({
  from,
  amount,
  minOut,
  routes,
  payerIsUser,
}: {
  from: string;
  amount: bigint;
  minOut: bigint;
  routes: Route[];
  payerIsUser: boolean;
}) {
  const encodedArgs = abiCoder.encode(
    ["address", "uint256", "uint256", "(address,address,bool)[]", "bool"],
    [
      from,
      amount,
      minOut,
      routes.map(({ fromTokenAddress, toTokenAddress, stable }) => [
        fromTokenAddress,
        toTokenAddress,
        stable,
      ]),
      payerIsUser,
    ]
  );
  return encodedArgs;
}
