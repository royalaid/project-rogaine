import { ethers } from "hardhat";

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

export type Route = {
  fromTokenAddress: string;
  toTokenAddress: string;
  stable: boolean;
};

export function encodeV3SwapParams({
  recipient,
  amountIn,
  amountOutMinimum,
  path,
  payerIsUser,
}: {
  recipient: string;
  amountIn: bigint;
  amountOutMinimum: bigint;
  path: [string, number, string];
  payerIsUser: boolean;
}) {
  const encodedPath = abiCoder.encode(["address", "uint24", "address"], path);
  const encodedArgs = abiCoder.encode(
    ["address", "uint256", "uint256", "bytes", "bool"],
    [recipient, amountIn, amountOutMinimum, encodedPath, payerIsUser]
  );
  return encodedArgs;
}

export function encodeV2SwapParams({
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
      routes.map(({ fromTokenAddress, toTokenAddress, stable }) => [fromTokenAddress, toTokenAddress, stable]),
      payerIsUser,
    ]
  );
  return encodedArgs;
}
