require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-web3");
require("hardhat-contract-sizer");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
      {
        version: "0.8.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },

      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
      {
        version: "0.7.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
      {
        version: "0.6.2",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/pP20rgm6kivcsBb-Oa2Khu6_qbcYh8z1",
      },
    },
    testnet: {
      url: `https://eth-goerli.public.blastapi.io`,
      accounts: [process.env.PRIVATE_KEY],
    },
    ethereum: {
      url: `https://fragrant-responsive-silence.quiknode.pro/${process.env.QUICKNODE_KEY}/`,
      accounts: [process.env.PRIVATE_KEY],
      port: 443,
      // gasPrice: 75000000000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  gasReporter: {
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    enabled: process.env.COINMARKETCAP_API_KEY !== undefined,
    url: "https://eth-mainnet.g.alchemy.com/v2/pP20rgm6kivcsBb-Oa2Khu6_qbcYh8z1",
    token: "ETH",
    gasPriceApi:
      "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice",
  },
};
