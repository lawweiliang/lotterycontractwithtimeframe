/*
Notes:
chainlink is in decimal 8 according to their documents
web3.eth.toWei('100', 'ether') equal to USD 100
web3.utils.toWei('0.1', 'ether') equal to 0.1 chainlink token

development using rinkeby keyhash and fee

*/
const web3 = require('web3');

module.exports = {
  networks: {
    development: {
      chainlink_randomness_keyhash: '0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311',
      chainlink_randomness_fee: web3.utils.toWei('0.1', 'ether')
    },
    rinkeby: {
      chainlink_price_feed_ETH_USD_address: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
      chainlink_randomness_link_token_address: '0x01BE23585060835E02B77ef475b0Cc51aA1e0709',
      chainlink_randomness_vrf_coordinator_address: '0xb3dCcb4Cf7a26f6cf6B120Cf5A73875B7BBc655B',
      chainlink_randomness_keyhash: '0x2ed0feb3e7fd2022120aa84fab1945545a9f2ffc9076fd6156fa96eaff4c1311',
      chainlink_randomness_fee: web3.utils.toWei('0.1', 'ether')
    },
    mainnet: {
      chainlink_price_feed_ETH_USD_address: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      chainlink_randomness_link_token_address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      chainlink_randomness_vrf_coordinator_address: '0xf0d54349aDdcf704F77AE15b96510dEA15cb7952',
      chainlink_randomness_keyhash: '0xAA77729D3466CA35AE8D28B3BBAC7CC36A5031EFDC430821C02BC31A238AF445',
      chainlink_randomness_fee: web3.utils.toWei('2', 'ether')
    },
  },
  chainlink: {
    ETHUSD: {
      price: 2000 * Math.pow(10, 8),
      decimal: 8
    }
  },
  ticket_fee_in_USD: {
    value: web3.utils.toWei('100', 'ether'),
    decimal: 18
  }
}