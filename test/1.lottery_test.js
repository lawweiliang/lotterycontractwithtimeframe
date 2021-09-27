const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const globalVar = require('../variable/global_variable.js');

const MockV3Aggregator = artifacts.require('MockV3Aggregator');
const VRFCoordinatorMock = artifacts.require('VRFCoordinatorMock');
const LinkToken = artifacts.require('LinkToken');
const Lottery = artifacts.require('Lottery');

contract('Lottery', ([alice, bob, ali, admin]) => {

  let lotteryInstance;
  let linkTokenInstance;
  let VRFCoordinatorMockInstance;
  beforeEach(async () => {
    const chainLinkPriceFeedInstance = await MockV3Aggregator.new(globalVar.chainlink.ETHUSD.decimal, globalVar.chainlink.ETHUSD.price);
    linkTokenInstance = await LinkToken.new();
    VRFCoordinatorMockInstance = await VRFCoordinatorMock.new(linkTokenInstance.address);

    lotteryInstance = await Lottery.new(chainLinkPriceFeedInstance.address, VRFCoordinatorMockInstance.address, linkTokenInstance.address, globalVar.networks.development.chainlink_randomness_fee, globalVar.networks.development.chainlink_randomness_keyhash);

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

    /*     it.only('lotteryStart test - not enough link', async () => {
    
    
          // await linkTokenInstance.approve(alice, 1000, { from: bob });
          // await linkTokenInstance.transfer(alice, 1000);
          // await linkTokenInstance.transfer(bob, 1000);
          // await linkTokenInstance.transferFrom(bob, alice, 1000, { from: alice });
    
          // const balance = await linkTokenInstance.balanceOf(bob);
          // console.log('balance', balance.toString());
    
    
          // await linkTokenInstance.approve(alice, web3.utils.toWei('1', 'ether'), { from: alice });
          // await linkTokenInstance.transferFrom(lotteryInstance.address, alice, web3.utils.toWei('1', 'ether'), { from: alice });
    
          // await linkTokenInstance.approve(alice, 1000);
          // await lotteryInstance.returnLinkToken(alice);
          // const balance = await linkTokenInstance.balanceOf(alice);
          // console.log('balance', balance.toString());
    
    
          // await linkTokenInstance.transferFrom(lotteryInstance.address, alice, web3.utils.toWei('1', 'ether'), { from: alice });
          // expectRevert(lotteryInstance.lotteryStart(), 'Require Error: Smart Contract Not enough LINK - fill contract with link token');
          // const linkBalance = await lotteryInstance.getLinkBalance();
          // console.log('linkBalance', linkBalance.toString());
          // const chainLinkFee = await lotteryInstance.getChainLinkFee();
          // console.log('chainLinkFee', chainLinkFee.toString());
    
        }); */


    it('lotteryStart test - revert', async () => {
      await lotteryInstance.lotteryStart();
      expectRevert(lotteryInstance.lotteryStart(), 'Require Error: Current Lottery State is not clossing state');
    });

    it('lotteryStart test - event', async () => {
      const lotteryReceipt = await lotteryInstance.lotteryStart();
      expectEvent(lotteryReceipt, 'LotteryStart', { _lotteryState: '0', _message: 'Event: Starting Lottery' });
    });
  });


  describe('Game Start', () => {
    beforeEach(async () => {
      await lotteryInstance.lotteryStart();
      await lotteryInstance.buyLotteryTicket({ from: alice, value: web3.utils.toWei('1', "ether") });
      await lotteryInstance.buyLotteryTicket({ from: bob, value: web3.utils.toWei('1', "ether") });

      //Manually generate the random number;
      const receipt = await lotteryInstance.calculateRandomNumber();
      const requestId = receipt.logs[0].args._requestId;
      const randomness = 777;
      await VRFCoordinatorMockInstance.callBackWithRandomness(requestId, randomness, lotteryInstance.address);

    });

    it('getWinnerAmount function test', async () => {
      const balance = await lotteryInstance.getWinnerAmount(bob);
      assert.equal(balance.toString(), web3.utils.toWei('2', 'ether'));
    });

    it('getWinnerAddress function test', async () => {
      const winner = await lotteryInstance.getWinnerAddress();
      assert.equal(winner[winner.length - 1], bob);
    })
  });

});


//Todo: Test all the solidity function in Lottery folder
//Todo: Add the timer for the lottery start and end. 
//Todo: Receive and return token from smart contract

// 1 week 4 lottery
// Auto start, auto end and auto processing the winner