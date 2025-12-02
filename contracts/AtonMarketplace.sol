// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AtonMarketplace is ERC721URIStorage, ReentrancyGuard, Ownable {
    uint256 private _tokenIds;
    uint256 private _itemsSold;

    struct MarketItem {
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        address designatedBuyer; // If set, only this address can buy (Admin listing)
        bool sold;
        bool isResale;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated(
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        address designatedBuyer,
        bool sold,
        bool isResale
    );

    constructor() ERC721("PolyAmoyNFT", "PAM") Ownable(msg.sender) {}

    /* 1. ADMIN: Mint and List Logic */
    function createToken(string memory tokenURI, uint256 price, address designatedBuyer) public onlyOwner returns (uint256) {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(address(this), newTokenId); // Mint directly to contract
        _setTokenURI(newTokenId, tokenURI);

        idToMarketItem[newTokenId] = MarketItem(
            newTokenId,
            payable(msg.sender), // Seller is Admin
            payable(address(this)), // Owner is Contract (Escrow)
            price,
            designatedBuyer,
            false,
            false // Not a resale, it's a primary sale
        );

        emit MarketItemCreated(newTokenId, msg.sender, address(this), price, designatedBuyer, false, false);
        return newTokenId;
    }

    /* 2. USER: Buy Designated NFT */
    function buyFirstHand(uint256 tokenId) public payable nonReentrant {
        uint256 price = idToMarketItem[tokenId].price;
        address designated = idToMarketItem[tokenId].designatedBuyer;
        
        require(msg.value == price, "Please submit the asking price");
        require(msg.sender == designated, "This NFT is reserved for a specific user");
        require(idToMarketItem[tokenId].isResale == false, "Item is on resale market");

        // Transfer Money to Admin (Seller)
        idToMarketItem[tokenId].seller.transfer(msg.value);
        
        // Transfer NFT to Buyer
        _transfer(address(this), msg.sender, tokenId);
        
        idToMarketItem[tokenId].owner = payable(msg.sender);
        idToMarketItem[tokenId].sold = true;
        idToMarketItem[tokenId].seller = payable(address(0));
        _itemsSold++;
    }

    /* 3. USER: Resell NFT (Put back on market) */
    function resellToken(uint256 tokenId, uint256 price) public payable nonReentrant {
        require(idToMarketItem[tokenId].owner == msg.sender, "Only item owner can perform this operation");
        
        // Transfer NFT back to contract (Escrow)
        // Frontend must ask for Approval first!
        _transfer(msg.sender, address(this), tokenId);

        idToMarketItem[tokenId].sold = false;
        idToMarketItem[tokenId].price = price;
        idToMarketItem[tokenId].seller = payable(msg.sender);
        idToMarketItem[tokenId].owner = payable(address(this));
        idToMarketItem[tokenId].designatedBuyer = address(0); // Open to everyone
        idToMarketItem[tokenId].isResale = true;
        
        _itemsSold--;
    }

    /* 4. ANONYMOUS: Buy Resale NFT */
    function buySecondHand(uint256 tokenId) public payable nonReentrant {
        uint256 price = idToMarketItem[tokenId].price;
        require(msg.value == price, "Please submit the asking price");
        require(idToMarketItem[tokenId].isResale == true, "This item is not for resale");

        address payable seller = idToMarketItem[tokenId].seller;

        // Pay seller
        seller.transfer(msg.value);

        // Transfer NFT
        _transfer(address(this), msg.sender, tokenId);

        idToMarketItem[tokenId].owner = payable(msg.sender);
        idToMarketItem[tokenId].sold = true;
        idToMarketItem[tokenId].seller = payable(address(0));
        _itemsSold++;
    }

    /* FETCHER HELPER */
    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 itemCount = _tokenIds;
        uint256 unsoldItemCount = _tokenIds - _itemsSold;
        uint256 currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(this)) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
    
    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _tokenIds;
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }
}