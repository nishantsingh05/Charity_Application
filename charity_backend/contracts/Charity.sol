// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

// error Charity__Notowner();

/**@title A sample Charity Contract
 * @author Nishant Singh
 * @notice This contract is for creating a sample Charity contract
 * @dev This implements price feeds as our library
 */

contract Charity {
    //type declaration
    using PriceConverter for uint256;

    //State variables
    address private immutable i_owner; // only person who can register needy people
    mapping(address => uint256) public s_moneyRequests; // variable to store requests of people
    address[] public s_peoples;
    mapping(address => bool) public s_needyRegisterdpeople;
    AggregatorV3Interface private s_priceFeed;
    uint256 public constant MINIMUM_USD = 100 * 10**18;

    // Events (we have none!)

    // Modifiers

    modifier onlyowner() {
        require(msg.sender == i_owner, "Only owner can register peoples");
        _;
    }

    modifier onlyregisteredpeople() {
        require(
            s_needyRegisterdpeople[msg.sender] == true,
            "Only Registered people can ask for money"
        );
        _;
    }

    //// Functions Order:
    //// constructor
    //// receive
    //// fallback
    //// external
    //// public
    //// internal
    //// private
    //// view / pure

    constructor(address priceFeed) {
        s_priceFeed = AggregatorV3Interface(priceFeed);
        i_owner = msg.sender;
    }

    receive() external payable {}

    // Registering needy People only by owner
    function register(address needy) public onlyowner {
        s_needyRegisterdpeople[needy] = true;
        s_moneyRequests[needy] = 0;
        s_peoples.push(needy);
    }

    //function to handle Money request only by registered people
    function MoneyRequest(uint256 amount) public onlyregisteredpeople {
        if (address(this).balance > (1000000000000000000 + amount)) {
            payable(msg.sender).transfer(amount);
        } else {
            s_moneyRequests[msg.sender] += amount;
        }
    }

    function distributeDonation() public {
        for (uint256 i = 0; i < s_peoples.length; i++) {
            if (address(this).balance <= 1000000000000000000) {
                break;
            }
            if (s_moneyRequests[s_peoples[i]] != 0) {
                if (
                    address(this).balance >=
                    (1000000000000000000 + s_moneyRequests[s_peoples[i]])
                ) {
                    payable(s_peoples[i]).transfer(
                        s_moneyRequests[s_peoples[i]]
                    );
                }
            }
        }
    }

    function Donate() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!"
        );
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
    function getbalance () public view returns(uint256){
    	return address(this).balance;
    } 
    function getMinDonationValue () public view returns(uint256){
    	return MINIMUM_USD/10**18;
    }
}
