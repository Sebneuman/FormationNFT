require("@nomicfoundation/hardhat-toolbox");
require('hardhat-gas-reporter')
require('dotenv').config();
require('@nomicfoundation/hardhat-verify');
require('solidity-coverage');

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "";
const MUMBAI_RPC_URL = process.env.MUMBAI_RPC_URL || "";
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY  || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY  || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    mainnet: {
      url: MAINNET_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 1
    },
    polygon: {
      url: POLYGON_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 137
    },
    mumbai: {
      url: MUMBAI_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 80001
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 11155111
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  gasReporter: {
    enabled: true,
    noColors: true,
  },
  solidity: {
    compilers: [
      {
        version: "0.8.22"
      },
    ]
  }
};