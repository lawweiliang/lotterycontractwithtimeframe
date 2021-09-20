// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.7;

contract Lottery {
    //Allow people to invest into the lottery

    address payable[] players;

    //Event for lottery start and lottery end

    function buyLotteryTicket() public payable {
        //One lottery ticket USD 20
    }

    //Calculate the randomess, using chainlink method
    function calculateRandomness() private returns (uint256) {}

    //Start the lottery
    // Set a timer for the lottery
    function lotteryStart() public {}

    //End the lottery
    //Close the lottery
    //Find the winner
    //Send him money
    function lotteryEnd() public {}
}
