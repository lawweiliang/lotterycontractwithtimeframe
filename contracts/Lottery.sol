// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract Lottery is VRFConsumerBase, Ownable {
    //Allow people to invest into the lottery

    address payable[] players;

    //Winner address and amount win
    mapping(address => uint256) winnerHistory;
    address[] winnerAddress;

    uint256 entranceFeeInUsd;
    AggregatorV3Interface priceFeed;

    enum LotteryState {
        START,
        FINDING_WINNER,
        CLOSE
    }

    LotteryState lotteryState;

    uint256 chainLinkFee;
    bytes32 chainLinkKeyHash;

    //Event for lottery start and lottery end
    event SuccessfullyBoughtLotteryTicket(
        address playerAddress,
        string message
    );
    event LotteryStart(LotteryState _lotteryState, string _message);
    event LotteryFindingWinner(
        LotteryState _lotteryState,
        string _message,
        bytes32 _requestId
    );
    event LotteryClose(LotteryState _lotteryState, string _message);

    constructor(
        address _chainlinkPriceFeedAddress,
        address _chainLinkVRFCoordinator,
        address _chainLinkTokenAddress,
        uint256 _chainLinkFee,
        bytes32 _chainLinkKeyHash
    ) VRFConsumerBase(_chainLinkVRFCoordinator, _chainLinkTokenAddress) {
        lotteryState = LotteryState.CLOSE;

        //100usd
        entranceFeeInUsd = 100 * (10**18);
        priceFeed = AggregatorV3Interface(_chainlinkPriceFeedAddress);

        chainLinkFee = _chainLinkFee;
        chainLinkKeyHash = _chainLinkKeyHash;
    }

    function buyLotteryTicket() public payable {
        require(
            lotteryState == LotteryState.START,
            "Require Error: Current lottery game was close, wait for next game"
        );

        require(
            msg.value >= getEntranceFeeInEth(),
            "Require Error: Not Enough Fee, Minimum Entrance Fee is USD100"
        );

        players.push(payable(msg.sender));

        emit SuccessfullyBoughtLotteryTicket(
            msg.sender,
            "Event: Successfully Bought Lottery Ticker"
        );
    }

    function getEntranceFeeInEth() public view returns (uint256) {
        uint8 decimal = priceFeed.decimals();
        (, int256 answer, , , ) = priceFeed.latestRoundData();
        return
            (entranceFeeInUsd * 10**18) /
            (uint256(answer) * (10**(18 - decimal)));
    }

    //Start the lottery
    // Set a timer for the lottery
    function lotteryStart() public onlyOwner {
        require(
            LINK.balanceOf(address(this)) >= chainLinkFee,
            "Require Error: Smart Contract Not enough LINK - fill contract with link token"
        );
        require(
            lotteryState == LotteryState.CLOSE,
            "Require Error: Current Lottery State is not clossing state"
        );
        lotteryState = LotteryState.START;

        emit LotteryStart(lotteryState, "Event: Starting Lottery");
    }

    //Test
    function getLinkBalance() public view returns (uint256) {
        return LINK.balanceOf(address(this));
    }

    function getChainLinkFee() public view returns (uint256) {
        return chainLinkFee;
    }

    function returnLinkToken(address _receiver) public {
        LINK.transferFrom(
            address(this),
            _receiver,
            LINK.balanceOf(address(this))
        );
    }

    //Calculate the randomess, using chainlink method
    function calculateRandomNumber() public onlyOwner returns (bytes32) {
        require(
            LINK.balanceOf(address(this)) >= chainLinkFee,
            "Require Error: Smart Contract Not enough LINK - fill contract with link token"
        );
        lotteryState = LotteryState.FINDING_WINNER;
        bytes32 requestId = requestRandomness(chainLinkKeyHash, chainLinkFee);
        emit LotteryFindingWinner(
            lotteryState,
            "Event: End Lottery",
            requestId
        );
        return requestId;
    }

    //chainlink callback function (compulsory)
    function fulfillRandomness(bytes32 _requestId, uint256 _randomness)
        internal
        override
    {
        require(
            lotteryState == LotteryState.FINDING_WINNER,
            "Require Error: calculateRandomness function was not called"
        );
        require(_randomness > 0, "Require Error: Random Number cannot be zero");
        lotteryEnd(_randomness);
    }

    function lotteryEnd(uint256 _randomNumber) internal {
        lotteryState = LotteryState.CLOSE;
        uint256 winnerIndex = _randomNumber % players.length;
        address payable winner = players[winnerIndex];

        uint256 amountWin = address(this).balance;
        winner.transfer(amountWin);

        //Reset
        players = new address payable[](0);

        //Record
        winnerHistory[winner] = amountWin;
        winnerAddress.push(winner);

        emit LotteryClose(lotteryState, "Event: End Lottery");
    }

    function getWinnerAmount(address _winnerAddress)
        public
        view
        returns (uint256)
    {
        return winnerHistory[_winnerAddress];
    }

    function getWinnerAddress() public view returns (address[] memory) {
        return winnerAddress;
    }

    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }
}
