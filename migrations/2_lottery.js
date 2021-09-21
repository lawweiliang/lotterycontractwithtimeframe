
const globalVar = require('../variable/global_variable.js');
const LotteryContract = artifacts.require('Lottery');

//chainlink mock contract
const MockV3Aggregator = artifacts.require('MockV3Aggregator');
const VRFCoordinatorMock = artifacts.require('VRFCoordinatorMock');
const LinkToken = artifacts.require('LinkToken');

module.exports = async (deployer, network, accounts) => {

  let chainlinkPriceFeedContractAddress;
  let chainlinkVrfCoordinatorAddress;
  let chainlinkTokenAddress;


  if (network != "development") {
    chainlinkPriceFeedContractAddress = globalVar.networks[network].chainlink_price_feed_ETH_USD_address;
    chainlinkVrfCoordinatorAddress = globalVar.networks[network].chainlink_randomness_vrf_coordinator_address;
    chainlinkTokenAddress = globalVar.networks[network].chainlink_randomness_link_token_address;

  } else {
    await deployer.deploy(MockV3Aggregator, globalVar.chainlink.ETHUSD.decimal, globalVar.chainlink.ETHUSD.price);
    const mockV3ContractInstance = await MockV3Aggregator.deployed();
    chainlinkPriceFeedContractAddress = mockV3ContractInstance.address;

    await deployer.deploy(LinkToken);
    const linkTokenInstance = await LinkToken.deployed();
    chainlinkTokenAddress = linkTokenInstance.address;

    await deployer.deploy(VRFCoordinatorMock, chainlinkTokenAddress);
    const VRFCoordinatorMockInstance = await VRFCoordinatorMock.deployed();
    chainlinkVrfCoordinatorAddress = VRFCoordinatorMockInstance.address;

    // chainlinkPriceFeedContractAddress = mockV3Contract.address;
    console.log('chainlinkPriceFeedContractAddress', chainlinkPriceFeedContractAddress);
    console.log('chainlinkTokenAddress', chainlinkTokenAddress);
    console.log('chainlinkVrfCoordinatorAddress', chainlinkVrfCoordinatorAddress);
  }

  await deployer.deploy(LotteryContract, chainlinkPriceFeedContractAddress, chainlinkTokenAddress, chainlinkVrfCoordinatorAddress, globalVar.networks[network].chainlink_randomness_fee, globalVar.networks[network].chainlink_randomness_keyhash);

  // const lotteryInstance = LotteryContract.deployed();
}