import { ethers } from "hardhat";

const abiCoder = ethers.AbiCoder.defaultAbiCoder();

export type Route = {
  fromTokenAddress: string;
  toTokenAddress: string;
  stable: boolean;
};

const encodePath = (path: string[], fees: number[]): string => {
  if (path.length != fees.length + 1) {
    throw new Error("path/fee lengths do not match");
  }

  let encoded = "0x";
  for (let i = 0; i < fees.length; i++) {
    // 20 byte encoding of the address
    encoded += path[i].slice(2);
    // 3 byte encoding of the fee
    encoded += fees[i].toString(16).padStart(2 * 3, "0");
  }
  // encode the final token
  encoded += path[path.length - 1].slice(2);

  return encoded.toLowerCase();
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
  const encodedPath = encodePath([path[0], path[2]], [path[1]]);
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
