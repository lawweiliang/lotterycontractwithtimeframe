

const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config()
const mnemonic = process.env.MNEMONIC_PHRASE;
const infuraProjectId = process.env.INFURA_PROJECT_ID;
const etherScanApiKey = process.env.ETHERSCAN_API_KEY;

module.exports = {

  networks: {

    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 7545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraProjectId}`),
      network_id: 4,
      gas: 5500000,
      skipDryRun: true
    },
  },
  mocha: {
    // timeout: 100000
  },
  plugins: [
    'truffle-plugin-verify'
  ],
  api_keys: {
    etherscan: etherScanApiKey
  },
  compilers: {
    solc: {
      version: "pragma"
    },
    /*    solc: {
         version: "0.6"
       },
       solc: {
         version: "0.8.7"
       }, */
  },
};
