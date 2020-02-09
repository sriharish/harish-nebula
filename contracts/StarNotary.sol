pragma solidity >=0.4.23;

import 'openzeppelin-solidity/contracts/token/ERC721/ERC721Full.sol';

contract StarNotary is ERC721Full("Harish Nebula", "HNT") {
    struct Star {
        string name;
    }

    mapping(uint256 => Star) public tokenIdToStarInfo; // id => star details
    mapping(uint256 => uint256) public starsForSale; // id => price
    mapping(uint256 => uint256) private starWantedFor; // id of star offered => id of star wanted

    // Create Star using the Struct
    function createStar(string memory _name, uint256 _tokenId) public {
        Star memory newStar = Star(_name);
        tokenIdToStarInfo[_tokenId] = newStar;
        _mint(msg.sender, _tokenId);
    }

    // Putting an Star for sale (Adding the star tokenid into the mapping starsForSale, first verify that the sender is the owner)
    function putStarUpForSale(uint256 _tokenId, uint256 _price) public {
        require(ownerOf(_tokenId) == msg.sender, "You can't sell a star you don't own");
        starsForSale[_tokenId] = _price;
    }

    // Function that allows you to convert an address into a payable address
    function _make_payable(address x) internal pure returns (address payable) {
        return address(uint160(x));
    }

    function buyStar(uint256 _tokenId) public payable {
        require(starsForSale[_tokenId] > 0, "The Star should be up for sale");
        uint256 starCost = starsForSale[_tokenId];
        address ownerAddress = ownerOf(_tokenId);
        require(msg.value > starCost, "You need to have enough Ether");
        _transferFrom(ownerAddress, msg.sender, _tokenId);
        address payable ownerAddressPayable = _make_payable(ownerAddress);
        ownerAddressPayable.transfer(starCost);
        if(msg.value > starCost) {
            msg.sender.transfer(msg.value - starCost);
        }
    }

    // facilitates a one to one trade of star tokens
    function exchangeStars(uint256 _tokenToTradeId, uint256 _tokenToReceiveId) public {
        require(_exists(_tokenToTradeId) && _exists(_tokenToReceiveId), "Both tokens in exchange must exist");
        address userTrading = ownerOf(_tokenToTradeId);
        require(userTrading == msg.sender, "You must be the owner of the star token to exchange");
        address userReceiving = ownerOf(_tokenToReceiveId); // user receiving can already have put in a trade
        // token wanted is already listed for trade
        if(starWantedFor[_tokenToReceiveId] == _tokenToTradeId) {
            // no need for safe transfer since token existence and owner are already checked
            _transferFrom(userTrading, userReceiving, _tokenToTradeId);
            _transferFrom(userReceiving, userTrading, _tokenToReceiveId);
            delete starWantedFor[_tokenToReceiveId]; // reset mapping so duplicate, erroneous trade cannot be run by same owner
        } else {
            starWantedFor[_tokenToTradeId] = _tokenToReceiveId;
        }
    }

    function transferStarTo(address _receiver, uint256 _tokenId) public {
        // checks if token exists and if sender is owner/approver, then sends
        safeTransferFrom(msg.sender, _receiver, _tokenId);
    }
}