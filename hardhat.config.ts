require("dotenv").config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    baseChain: {
      url: 'https://base.llamarpc.com',
      chainId: 8453,
      accounts: [String(process.env.MATIC_KEY2)],
    },
    hardhat: {
      forking: {
        url: 'https://base.llamarpc.com',
      }
    },
  },
};
export default config;
