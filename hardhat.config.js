require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            evmVersion: "paris"
        }
    },
    networks: {
        localhost: {
            url: "http://127.0.0.1:7545"
        },
        sepolia: {
            url: process.env.SEPOLIA_RPC_URL,
            chainId: 11155111,
            accounts: [process.env.PRIVATE_KEY]
        }
    }
};
