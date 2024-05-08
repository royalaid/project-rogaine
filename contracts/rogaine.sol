pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IAERO.sol";

interface IERC20Name {
    function name() external view returns (string memory);
}

contract Rogaine is ERC1155, Ownable {

    uint256 immutable creatorTokenShare = 0.0006969 ether;

    IAero public aerodromeRouter = IAero(0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43);
    address public defaultFactory;
    address public creator;
    string public name;

    address public memeCoinAddress;
    uint256 public _currentTokenID = 0;
    mapping(uint256 => address) public creators;
    mapping(uint256 => uint256) public tokenSupply;
    mapping(uint256 => string) public _tokenURIs;

    mapping(address => bool) public allowListed;
    bool allowlisting = false;

    event MemeCreated(uint256 tokenID, address creator);
    event MemePurchased(uint256 tokenID, address buyer, uint256 amount, uint256 memeCoinsBought);

    constructor(address _memeCoinAddress, address _creator) ERC1155("if you are here you are early") Ownable(msg.sender) {
        memeCoinAddress = _memeCoinAddress;
        defaultFactory = aerodromeRouter.defaultFactory();
        creator = _creator;
        name = IERC20Name(memeCoinAddress).name();
    }

    function setDonations(address _donate, bool value) public onlyOwner {
        allowListed[_donate] = value;
    }

    function setIpfsHash(uint256 tokenId, string memory ipfsHash) public onlyOwner {
        // just in case of shenanigans
        _tokenURIs[tokenId] = ipfsHash;
    }

    // Override the uri function to return custom token URIs in JSON format
    function uri(uint256 tokenID) public view override returns (string memory) {
        if(bytes(_tokenURIs[tokenID]).length > 0) {
            return _tokenURIs[tokenID];
        }
        else
        return super.uri(tokenID); // Fallback to the default URI
    }

    function setAllowListing(bool value) public onlyOwner {
        allowlisting = value;
    }

    function createMemeFor(address donate, string memory ipfsHash, uint256 minTokens) public payable returns (uint256) {
        require(allowlisting == false || (allowlisting==true && allowListed[donate]==true), "Not in allow list");
        require(msg.value >= 0.01 ether, "Minimum 0.01 ETH required to create memes");
        uint256 newTokenID = _getNextTokenID();
        _incrementTokenTypeId();
        creators[newTokenID] = donate;

        // Swap ETH for MemeCoins, excluding the creator fee
        uint256 amountForSwap = msg.value;
        _swapETHForMemeCoins(amountForSwap, msg.sender, minTokens);

        _tokenURIs[newTokenID] = ipfsHash; // Set the IPFS image hash as the token URI for the new token ID

        _mint(msg.sender, newTokenID, 1, ""); // Mint one meme NFT for the meme creator
        emit MemeCreated(newTokenID, msg.sender);

        return newTokenID;
    }

    function buyMeme(uint256 tokenID, uint256 minTokens) public payable {
        require(msg.value >= 0.0011 ether, "ETH required to buy meme coins");
        require(creators[tokenID] != address(0), "Meme does not exist");

        // Swap ETH for MemeCoins, deducting the shares for the creators
        uint256 amountForSwap = msg.value - creatorTokenShare;
        uint256 memeCoinsBought = _swapETHForMemeCoins(amountForSwap, msg.sender, minTokens);

        _mint(msg.sender, tokenID, 1, ""); // Mint a single meme NFT
        payable(creators[tokenID]).transfer(creatorTokenShare);
        emit MemePurchased(tokenID, msg.sender, 1, memeCoinsBought);
    }

    function _getNextTokenID() private view returns (uint256) {
        return _currentTokenID + 1;
    }

    function _incrementTokenTypeId() private {
        _currentTokenID++;
    }

    function _swapETHForMemeCoins(uint256 ethAmount, address to, uint256 minTokens) internal returns (uint256) {
        IAero.Route[] memory route = new IAero.Route[](1);
        route[0] = IAero.Route({
            from: 0x4200000000000000000000000000000000000006,
            to: memeCoinAddress,
            stable: false,
            factory: defaultFactory
        });
        uint256[] memory amounts = aerodromeRouter.swapExactETHForTokens{value: ethAmount}(minTokens, route, to, block.timestamp + 5 hours);
        return amounts[0];
    }
}
