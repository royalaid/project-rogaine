pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IAERO.sol";

interface IERC20 {
    function name() external view returns (string memory);
}

contract Rogaine is ERC1155, Ownable {

    IAero public aerodromeRouter;
    address public defaultFactory;
    address public creator;
    string public name;

    address public memeCoinAddress;
    uint256 private _currentTokenID = 0;
    mapping(uint256 => address) public creators;
    mapping(uint256 => uint256) public tokenSupply;
    mapping(uint256 => string) public _tokenURIs;

    event MemeCreated(uint256 tokenID, address creator);
    event MemePurchased(uint256 tokenID, address buyer, uint256 amount, uint256 memeCoinsBought);

    constructor(address _aerodromeRouter, address _memeCoinAddress, address _creator) ERC1155("if you are here you are early") Ownable(msg.sender) {
        aerodromeRouter = IAero(_aerodromeRouter);
        memeCoinAddress = _memeCoinAddress;
        defaultFactory = aerodromeRouter.defaultFactory();
        creator = _creator;
        name = IERC20(memeCoinAddress).name();
    }


    // Helper function to convert address to string
    function toHexString(address account) internal pure returns (string memory) {
        return toHexString(uint256(uint160(account)), 20);
    }

    function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
        bytes memory buffer = new bytes(2 * length + 2);
        buffer[0] = "0";
        buffer[1] = "x";
        bytes memory characters = "0123456789abcdef";
        for (uint256 i = 2 * length + 1; i > 1; --i) {
            buffer[i] = characters[value & 0xf];
            value >>= 4;
        }
        require(value == 0, "Strings: hex length insufficient");
        return string(buffer);
    }

    function uint256ToString(uint256 value) internal pure returns (string memory) {
        // Base case: 0
        if (value == 0) {
            return "0";
        }
        // Temp variable for calculation
        uint256 temp = value;
        // Calculate the length of the number
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        // Allocate memory for the string
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + value % 10));
            value /= 10;
        }
        return string(buffer);
    }

    // Override the uri function to return custom token URIs in JSON format
    function uri(uint256 tokenID) public view override returns (string memory) {
        if(bytes(_tokenURIs[tokenID]).length > 0) {
            return string(abi.encodePacked("https://regen.lol/api/meme/", toHexString(address(this)), "/", uint256ToString(tokenID), ".json"));
        }
        else
        return super.uri(tokenID); // Fallback to the default URI
    }

    function createMeme(string memory ipfsImageHash, uint256 minTokens) public payable returns (uint256) {
        uint256 creatorFee = 0.000777 ether;
        require(msg.value >= 0.05 ether, "Minimum 0.05 ETH required to create memes");
        uint256 newTokenID = _getNextTokenID();
        _incrementTokenTypeId();
        creators[newTokenID] = msg.sender;

        // Swap ETH for MemeCoins, excluding the creator fee
        uint256 amountForSwap = msg.value - creatorFee;
        _swapETHForMemeCoins(amountForSwap, msg.sender, minTokens);

        _tokenURIs[newTokenID] = ipfsImageHash; // Set the IPFS image hash as the token URI for the new token ID
        payable(creator).transfer(creatorFee); // Transfer the creator fee
        _mint(msg.sender, newTokenID, 1, ""); // Mint one meme NFT for the meme creator
        emit MemeCreated(newTokenID, msg.sender);

        return newTokenID;
    }

    function buyMeme(uint256 tokenID, uint256 minTokens) public payable {
        require(msg.value >= 0.01 ether, "ETH required to buy meme coins");
        require(creators[tokenID] != address(0), "Meme does not exist");

        uint256 creatorShare = 0.000111 ether;
        uint256 creatorTokenShare = 0.000777 ether;

        uint256 totalCreatorShare = creatorShare + creatorTokenShare;

        payable(creator).transfer(creatorShare);
        payable(creators[tokenID]).transfer(creatorTokenShare);

        // Swap ETH for MemeCoins, deducting the shares for the creators
        uint256 amountForSwap = msg.value - totalCreatorShare;
        uint256 memeCoinsBought = _swapETHForMemeCoins(amountForSwap, msg.sender, minTokens);

        _mint(msg.sender, tokenID, 1, ""); // Mint a single meme NFT
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
