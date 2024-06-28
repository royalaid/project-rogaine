import { AddressLike } from "ethers";

export const percentFormatter = (num: number) => `${(num * 100).toFixed(2)}%`;

export const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

export const REGEN_WHALE = "0xA044C595d085A8956569B3bD996BE420e89533dE";
export const REGEN_ADDRESS = "0x1D653f09f216682eDE4549455D6Cf45f93C730cf";

export const TEST_TOKEN_MINTER = "0x93798Ef7e3A621d7C4EfF22eDA50B931fE57a3cF";
export const TEST_TOKEN_ADDRESS = "0xdce97DAd5335AeCbFA7410eE87cea9f6411a632f";

export const TEST_TOKEN_WETH_AERO_POOL_ADDRESS =
  "0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43";

export const addressToTokenName = new Map<AddressLike, string>([
  [WETH_ADDRESS, "WETH"],
  [TEST_TOKEN_ADDRESS, "TEST"],
]);
