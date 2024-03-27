pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IAERO.sol";

contract Rogaine is ERC1155, Ownable {

    IAero public aerodromeRouter;
    address public defaultFactory;

    address public memeCoinAddress;
    uint256 private _currentTokenID = 0;
    mapping(uint256 => address) public creators;
    mapping(uint256 => uint256) public tokenSupply;
    mapping(uint256 => string) public _tokenURIs;

    event MemeCreated(uint256 indexed tokenID, address creator);
    event MemePurchased(uint256 indexed tokenID, address buyer, uint256 amount, uint256 memeCoinsBought);

    constructor(address _aerodromeRouter, address _memeCoinAddress) ERC1155("https://myapi.com/api/token/{id}.json") Ownable(msg.sender) {
        aerodromeRouter = IAero(_aerodromeRouter);
        memeCoinAddress = _memeCoinAddress;
        defaultFactory = aerodromeRouter.defaultFactory();
    }
    
    // Override the uri function to return custom token URIs
    function uri(uint256 tokenID) public view override returns (string memory) {
        if(bytes(_tokenURIs[tokenID]).length > 0) {
            return _tokenURIs[tokenID];
        }
        return super.uri(tokenID); // Fallback to the default URI
    }

    function createMeme(string memory ipfsImageHash) public payable returns (uint256) {
        require(msg.value >= 0.01 ether, "Minimum 0.01 ETH required to create meme coins");
        uint256 newTokenID = _getNextTokenID();
        _incrementTokenTypeId();
        creators[newTokenID] = msg.sender;

        // Swap ETH for MemeCoins
        _swapETHForMemeCoins(msg.value, msg.sender);

        _tokenURIs[newTokenID] = ipfsImageHash; // Set the IPFS image hash as the token URI for the new token ID
        _mint(msg.sender, newTokenID, 1, ""); // Mint one meme NFT for the creator
        emit MemeCreated(newTokenID, msg.sender);

        return newTokenID;
    }

    function buyMeme(uint256 tokenID) public payable {
        require(msg.value > 0, "ETH required to buy meme coins");
        require(creators[tokenID] != address(0), "Meme does not exist");

        // Swap ETH for MemeCoins
        uint256 memeCoinsBought = _swapETHForMemeCoins(msg.value, msg.sender);

        _mint(msg.sender, tokenID, 1, ""); // Mint a single meme NFT
        emit MemePurchased(tokenID, msg.sender, 1, memeCoinsBought);
    }

    function _getNextTokenID() private view returns (uint256) {
        return _currentTokenID + 1;
    }

    function _incrementTokenTypeId() private {
        _currentTokenID++;
    }

    function _swapETHForMemeCoins(uint256 ethAmount, address to) internal returns (uint256) {
        IAero.Route[] memory route = new IAero.Route[](1);
        route[0] = IAero.Route({
            from: aerodromeRouter.ETHER(),
            to: memeCoinAddress,
            factory: defaultFactory
        });
        uint256[] memory amounts = aerodromeRouter.swapExactETHForTokens{value: ethAmount}(0, route, to, block.timestamp + 1 hours);
        return amounts[1]; // Return the amount of meme coins bought
    }
}
