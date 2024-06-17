require("dotenv").config();
import { HardhatUserConfig } from "hardhat/config";
import "hardhat-tracer";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    baseChain: {
      url: "https://mainnet.base.org",
      chainId: 8453,
      accounts: [String(process.env.MATIC_KEY2)],
    },
    hardhat: {
      forking: {
        url: "https://mainnet.base.org",
      },
    },
    localhost: {
      url: "http://localhost:8545",
      accounts: [String(process.env.MATIC_KEY2)],
    },
  },
};
export default config;
