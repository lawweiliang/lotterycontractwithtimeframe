const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const globalVar = require('../variable/global_variable.js');

const MockV3Aggregator = artifacts.require('MockV3Aggregator');
const VRFCoordinatorMock = artifacts.require('VRFCoordinatorMock');
const LinkToken = artifacts.require('LinkToken');
const Lottery = artifacts.require('Lottery');

contract('Lottery', ([alice, bob, ali, admin]) => {

  let lotteryInstance;
  let linkTokenInstance;
  beforeEach(async () => {
    const chainLinkPriceFeedInstance = await MockV3Aggregator.new(globalVar.chainlink.ETHUSD.decimal, globalVar.chainlink.ETHUSD.price);
    linkTokenInstance = await LinkToken.new();
    const VRFCoordinatorMockInstance = await VRFCoordinatorMock.new(linkTokenInstance.address);

    lotteryInstance = await Lottery.new(chainLinkPriceFeedInstance.address, linkTokenInstance.address, VRFCoordinatorMockInstance.address, globalVar.networks.development.chainlink_randomness_fee, globalVar.networks.development.chainlink_randomness_keyhash);

    //Transfer at least 0.1 link to the smart contract
    await linkTokenInstance.transfer(lotteryInstance.address, web3.utils.toWei('1', 'ether'));

  });

  it('smart contract must have 1 link token for gas', async () => {
    const balance = await linkTokenInstance.balanceOf(lotteryInstance.address);
    assert.equal(balance.toString(), web3.utils.toWei('1', 'ether'));
  });


  it('buyLotteryTicket lottery not started yet', async () => {
    await expectRevert(lotteryInstance.buyLotteryTicket({ from: alice, value: web3.utils.toWei('1', "ether") }), 'Require Error: Current lottery game was close, wait for next game');
  });

  describe('buyLotteryTicker test lottery start', () => {
    beforeEach(async () => {
      await lotteryInstance.lotteryStart();
    });

    it('buyLotteryTicket test - fail', async () => {
      // 0.01 ether = 0.01 * 2000 = USD 20
      await expectRevert(lotteryInstance.buyLotteryTicket({ from: alice, value: web3.utils.toWei('0.01', "ether") }), 'Require Error: Not Enough Fee, Minimum Entrance Fee is USD100');
    });

    it('buyLotteryTicket test - success', async () => {
      // 1 ether = 1 * 2000 = USD 20000
      const lotteryReceipt = await lotteryInstance.buyLotteryTicket({ from: alice, value: web3.utils.toWei('1', "ether") });
      await expectEvent(lotteryReceipt, 'SuccessfullyBoughtLotteryTicket', { playerAddress: alice, message: 'Event: Successfully Bought Lottery Ticker' });

      const contractBalance = await web3.eth.getBalance(lotteryInstance.address);
      assert.equal(contractBalance, web3.utils.toWei('1', 'ether'));
    });

  });


  it('getEntranceFeeInEth test', async () => {
    const ticketFee = globalVar.ticket_fee_in_USD.value;
    const ethPrice = globalVar.chainlink.ETHUSD.price * Math.pow(10, 18 - globalVar.chainlink.ETHUSD.decimal);
    const precision = 1 * Math.pow(10, 18);
    const ticketFeeInUsd = BigInt(ticketFee) * BigInt(precision) / BigInt(ethPrice);

    const entranceFeeInEth = await lotteryInstance.getEntranceFeeInEth();
    assert.equal(entranceFeeInEth.toString(), ticketFeeInUsd.toString());
  });



  describe('lotteryStart function test', () => {
    it('lotteryStart test - revert', async () => {
      await lotteryInstance.lotteryStart();
      expectRevert(lotteryInstance.lotteryStart(), 'Require Error: Current Lottery State is not clossing state');
    });

    it.only('lotteryStart test - event', async () => {
      const lotteryReceipt = await lotteryInstance.lotteryStart();
      console.log('lotteryReceipt', lotteryReceipt.log);
      expectEvent(lotteryReceipt, 'LotteryStart', { lotteryState: 1, message: 'Event: Starting Lottery' });
    });
  });




  describe('Game Start', () => {
    beforeEach(async () => {
      await lotteryInstance.lotteryStart();
      await lotteryInstance.buyLotteryTicket({ from: alice, value: web3.utils.toWei('1', "ether") });
      await lotteryInstance.buyLotteryTicket({ from: bob, value: web3.utils.toWei('1', "ether") });

      // await lotteryInstance.calculateRandomNumber();

      const linkBalance = await lotteryInstance.getLinkBalance();
      console.log('linkBalance', linkBalance);


    });

    it('Lottery Contract Balance', async () => {
      const balance = await web3.eth.getBalance(lotteryInstance.address);
      console.log('balance', balance);
      assert.equal(balance, web3.utils.toWei('2', 'ether'));
    });

    // it.only('getWinnerAmount function test', async () => {
    //   const balance = await lotteryInstance.getWinnerAmount(alice);
    //   assert.equal(balance.toString(), web3.utils.toWei('2', 'ether'));
    // });

    // it('getWinnerAddress', async () => {
    //   const winnerAddress = await lotteryInstance.getWinnerAddress();
    //   console.log('winnderAddress', winnerAddress);
    //   assert(winnerAddress in [alice, bob]);
    // });

  });



});


//Todo: Test all the solidity function in Lottery folder
//Todo: Add the timer for the lottery start and end. 
//Todo: Solidity Link token address is not functioning. 
//Todo: Tmr continue lotterystart function. 

// 1 week 4 lottery
// Auto start, auto end and auto processing the winner