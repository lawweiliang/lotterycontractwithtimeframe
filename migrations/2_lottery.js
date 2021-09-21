
const globalVar = require('../variable/global_variable.js');
const LotteryContract = artifacts.require('Lottery');


module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(LotteryContract, globalVar.networks[network].chainlink_price_feed_ETH_USD_address, globalVar.networks[network].chainlink_randomness_vrf_coordinator_address, globalVar.networks[network].chainlink_randomness_link_token_address, globalVar.networks[network].chainlink_randomness_fee, globalVar.networks[network].chainlink_randomness_keyhash);

  // const lotteryInstance = LotteryContract.deployed();
}