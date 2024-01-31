// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

/// @author Sébastien
/// @title Nom de la collection de NFT

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./ERC721A.sol";
import "./ERC721AQueryable.sol";

/* Potential Errors */
error WhitelistSaleNotActivated();
error NotWhitelisted();
error AmountNFTPerWalletExceeded();
error MaxSupplyExceeded();
error NotEnoughFunds();

error PublicSaleNotActivated();
error GiftNotAllowed();
error NonExistantToken();

contract NFTIsERC721A is ERC721A, ERC721AQueryable, Ownable{
    using Strings for uint;

    enum Step{
        Before,
        WhitelistSale,
        Between,
        PublicSale,
        Finished,
        Reveal
    }

    Step public step;

    uint256 private constant MAX_SUPPLY = 10; // nombre de NFT en vente
    uint256 private constant MAX_GIFT = 2; // nombre max de NFT qu'on peut donner si on est le propriétaire du smart contract
    uint256 private constant MAX_WHITELIST = 2; // nombre max de NFT que les utilisateurs vont pouvoir minter durant la whitelist
    uint256 private constant MAX_PUBLIC = 6; // nombre max de NFT que les utilisateurs vont pouvoir minter durant la public sale
    uint256 private constant MAX_SUPPLY_MINUS_GIFT = MAX_SUPPLY - MAX_GIFT;
    uint256 private constant PRICE_WHITELIST_MINT = 0.002 ether; // prix d'un NFT durant la whitelist
    uint256 private constant PRICE_PUBLIC_MINT = 0.003 ether; // prix d'un NFT durant la public sale

    uint256 public saleStartTime =  1706628904; // (timestamp) date à laquelle commence la public sale

    bytes32 public merkleRoot;

    string public baseURI;

    mapping(address => uint256) amountNFTperWalletWhitelistSale;
    mapping(address => uint256) amountNFTperWalletPublicSale;

    uint256 private constant MAX_PER_ADDRESS_DURING_WHITELIST_MINT = 1;
    uint256 private constant MAX_PER_ADDRESS_DURING_PUBLIC_MINT = 3;

    // Adresse qui va réceptionner les gains de la collection de NFT
    address payable gainAddress;

    // Mettre en pause le contrat s'il y a un problème
    bool public isPaused = false;

    constructor(bytes32 _merkleRoot, string memory _baseURI, address payable _gainAddress)
    ERC721A("NFT Ben BK", "BBK")
    Ownable(msg.sender)
    {
        merkleRoot = _merkleRoot;
        baseURI = _baseURI;
        gainAddress = _gainAddress;
    }

    /**
    * @notice Modifier that runs the code only if the contract is not paused
    */
    modifier WhenNotPaused(){
        require(!isPaused, "The contract is paused");
        _;
    }

    /**
    * @notice Mint function for the Whitelist Sale
    *
    * @param _account Account which will receive the NFT
    * @param _quantity Amount of NFTs the user wants to mint
    * @param _proof The Merkle Proof
    */
    function whitelistMint(address _account, uint256 _quantity, bytes32[] calldata _proof) external payable WhenNotPaused(){
        if(getStep() != Step.WhitelistSale){
            revert WhitelistSaleNotActivated();
        }
        if(!isWhitelisted(_account, _proof)){
            revert NotWhitelisted();
        }
        if(amountNFTperWalletWhitelistSale[msg.sender] + _quantity > MAX_PER_ADDRESS_DURING_WHITELIST_MINT){
            revert AmountNFTPerWalletExceeded();
        }
        if(totalSupply() + _quantity > MAX_WHITELIST){
            revert MaxSupplyExceeded();
        }
        if(msg.value < PRICE_WHITELIST_MINT * _quantity){
            revert NotEnoughFunds();
        }
        amountNFTperWalletWhitelistSale[msg.sender] += _quantity;
        _safeMint(_account, _quantity);
    }

    /**
    * @notice Mint function for the public sale
    *
    * @param _account Account which will receive the NFTs
    * @param _quantity Amount of NFTs the user wants to mint
    */
    function publicMint(address _account, uint256 _quantity) external payable WhenNotPaused(){
        if(getStep() != Step.PublicSale){
            revert PublicSaleNotActivated();
        }
        if(amountNFTperWalletPublicSale[msg.sender] + _quantity > MAX_PER_ADDRESS_DURING_PUBLIC_MINT){
            revert AmountNFTPerWalletExceeded();
        }
        if(totalSupply() + _quantity > MAX_SUPPLY_MINUS_GIFT){
            revert MaxSupplyExceeded();
        }
        if(msg.value < PRICE_PUBLIC_MINT * _quantity){
            revert NotEnoughFunds();
        }
        amountNFTperWalletPublicSale[msg.sender] += _quantity;
        _safeMint(_account, _quantity);
    }

    /**
    * @notice Allows the owner to gifts NFTS
    *
    * @param _to The address of the receiver
    * @param _quantity Amount of NFTs the owner wants to gift to the receiver
    */
    function gift(address _to, uint256 _quantity) external onlyOwner WhenNotPaused(){
        if(getStep() < Step.Finished){
            revert GiftNotAllowed();
        }
        if(totalSupply() + _quantity > MAX_SUPPLY){
            revert MaxSupplyExceeded();
        }
        _safeMint(_to, _quantity);
    }

    /**
    * @notice Allows to get the step of the sale
    */
    function getStep() public view returns(Step actualStep){
        if(block.timestamp < saleStartTime){
            return Step.Before;
        }
        if(block.timestamp >= saleStartTime && block.timestamp < saleStartTime + 12 hours){
            return Step.WhitelistSale;
        }
        if(block.timestamp >= saleStartTime + 12 hours && block.timestamp < saleStartTime + 24 hours){
            return Step.Between;
        }
        if(block.timestamp >= saleStartTime + 24 hours && block.timestamp < saleStartTime + 48 hours){
            return Step.PublicSale;
        }
        if(block.timestamp >= saleStartTime + 48 hours && block.timestamp < saleStartTime + 216 hours){
            return Step.Finished;
        }
        if(block.timestamp >= saleStartTime + 216 hours){
            return Step.Reveal;
        }
    }

    /**
    * @notice Allows to pause/unpause the smart contract
    *
    * @param _isPaused true or false if we want to pause or unpause the contract
    */
    function setPause(bool _isPaused) external onlyOwner{
        isPaused = _isPaused;
    }

    /**
    * @notice Change the starting time of the sale
    *
    * @param _saleStartTime The new starting timestamp of the sale
    */
    function setSaleStartTime(uint256 _saleStartTime) external onlyOwner{
        saleStartTime = _saleStartTime;
    }

    /**
    * @notice Change the baseURI of the NFTs
    *
    * @param _baseURI The new base URI of the NFTs
    */
    function setBaseURI(string memory _baseURI) external onlyOwner{
        baseURI = _baseURI;
    }

    /**
    * @notice Change the Merkle Root
    *
    * @param _merkleRoot The new Merkle root
    */
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner{
        merkleRoot = _merkleRoot;
    }

    /**
    * @notice Check if an address is whitelisted or not
    *
    * @param _account The account checked
    * @param _proof The Merkle Proof
    *
    * @return bool return true if the address is whitelisted, false otherwise
    */
    function isWhitelisted(address _account, bytes32[] calldata _proof) internal view returns(bool){
        return MerkleProof.verify(_proof, merkleRoot, keccak256(abi.encodePacked(_account)));
    }

    /**
    * @notice Get the token URI of a NFT by his ID
    *
    * @param _tokenId The ID of the NFT we want to have the URI of the metadatas
    *
    * @return string URI of an NFT by his ID
    */
    function tokenURI(uint256 _tokenId) public view virtual override(ERC721A, IERC721A) returns(string memory){
        if(!_exists(_tokenId)){
            revert NonExistantToken();
        }

        return string(abi.encodePacked(baseURI, _tokenId.toString(), ".json"));
    }

    /**
    * @notice Release the gains on the gainAddress account
    */
    function releaseAll() external onlyOwner{
        (bool success,) = gainAddress.call{value: address(this).balance}("");
        require(success);
    }
}