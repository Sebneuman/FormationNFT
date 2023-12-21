const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { expect } = require("chai");
const tokens = require("../utils/tokens.json");

describe("Tests NFTIsERC721A Contract", function(){
    before(async function(){
        [this.owner, this.addr1, this.addr2, this.addr3] = await ethers.getSigners(); // on récupère des adresses de la blockchain hardhat locale

        let tab = [];

        tokens.map((token) => {
            return tab.push(token.address);
        });

        const leaves = tab.map((address) => {
            return keccak256(address);
        });

        this.tree = new MerkleTree(leaves, keccak256, { sort: true });
        this.merkleTreeRoot = this.tree.getHexRoot();
        this.gainAddress = "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"; // yarn hardhat node puis on récupère l'adresse 7 par exemple
    });

    it("should deploy the smart contract", async function(){
        this.baseURI = "ipfs://CID/";
        this.contract = await hre.ethers.getContractFactory("NFTIsERC721A");
        this.deployedContract = await this.contract.deploy(
            this.merkleTreeRoot,
            this.baseURI,
            this.gainAddress
        );
    });

    it("should change the saleStartTime", async function(){
        let timestamp = parseInt(new Date().getTime() / 1000) - 2;
        await this.deployedContract.setSaleStartTime(timestamp);
        expect(await this.deployedContract.saleStartTime()).to.equal(timestamp);
    });

    it("sould not change the saleStartTime if not the owner", async function(){
        let timestamp = parseInt(new Date().getTime() / 1000) - 2;
        await expect(this.deployedContract.connect(this.addr1).setSaleStartTime(timestamp)).to.be.revertedWithCustomError(this.deployedContract, "OwnableUnauthorizedAccount");
    });

    it("sould get the step", async function(){
        expect(await this.deployedContract.getStep()).to.equal(1);
    });

    it("should get the merkleRoot, and the merkleRoot should have a length of 66", async function(){
        expect(await this.deployedContract.merkleRoot()).to.have.lengthOf(66);
    });

    it("should get the isPaused, and isPaused should be equal to false", async function(){
        expect(await this.deployedContract.isPaused()).to.equal(false);
    });

    /** Whitelist sale tests */
    it("should change the saleStartTime", async function(){
        let timestamp = parseInt(new Date().getTime() / 1000) + 30 * 3600;
        await this.deployedContract.setSaleStartTime(timestamp);
        expect(await this.deployedContract.saleStartTime()).to.equal(timestamp);
    });

    it("should not mint 1 NFT if the whitelist sale has not started yet", async function(){
        const leaf = keccak256(this.owner.address);
        const proof = this.tree.getHexProof(leaf);

        let price = ethers.parseEther("0.002");
        const overrides = {
            value: price
        }
        await expect(this.deployedContract.connect(this.owner).whitelistMint(this.owner.address, 1, proof, overrides)).to.be.revertedWithCustomError(this.deployedContract, "WhitelistSaleNotActivated");
    });

    it("should change the saleStartTime", async function(){
        let timestamp = parseInt(new Date().getTime() / 1000);
        await this.deployedContract.setSaleStartTime(timestamp);
        expect(await this.deployedContract.saleStartTime()).to.equal(timestamp);
    });

    it("should not mint 1 NFT if the user is not whitelisted", async function(){
        const leaf = keccak256(this.owner.address);
        const proof = this.tree.getHexProof(leaf);

        let price = ethers.parseEther("0.002");
        const overrides = {
            value: price
        }
        await expect(this.deployedContract.connect(this.owner).whitelistMint(this.owner.address, 1, proof, overrides)).to.be.revertedWithCustomError(this.deployedContract, "NotWhitelisted");
    });

    it("should mint 1 NFT if the user is whitelisted", async function(){
        const leaf = keccak256(this.addr1.address);
        const proof = this.tree.getHexProof(leaf);

        let price = ethers.parseEther("0.002");
        const overrides = {
            value: price
        }
        await this.deployedContract.connect(this.addr1).whitelistMint(this.addr1.address, 1, proof, overrides);
        let result = await this.deployedContract.tokensOfOwner(this.addr1.address);
        expect(result.length).to.equal(1);
    });

    it("should not mint 1 NFT during the whitelist sale if the user has already minted 1 NFT during the whitelist sale", async function(){
        const leaf = keccak256(this.addr1.address);
        const proof = this.tree.getHexProof(leaf);

        let price = ethers.parseEther("0.002");
        const overrides = {
            value: price
        }

        await expect(this.deployedContract.connect(this.addr1).whitelistMint(this.addr1.address, 1, proof, overrides)).to.be.revertedWithCustomError(this.deployedContract, "AmountNFTPerWalletExceeded");
    });

    it("totalSupply should be equal to 1", async function(){
        let totalSupply = await this.deployedContract.totalSupply();
        expect(totalSupply).to.equal(1);
    });

    it("should not mint 1 NFT during the whitelist sale if not enough ether is provided", async function(){
        const leaf = keccak256(this.addr2.address);
        const proof = this.tree.getHexProof(leaf);

        let price = ethers.parseEther("0.000002");
        const overrides = {
            value: price
        }

        await expect(this.deployedContract.connect(this.addr2).whitelistMint(this.addr2.address, 1, proof, overrides)).to.be.revertedWithCustomError(this.deployedContract, "NotEnoughFunds");
    });

    it("should mint 1 NFT if the user is whitelisted", async function(){
        const leaf = keccak256(this.addr2.address);
        const proof = this.tree.getHexProof(leaf);

        let price = ethers.parseEther("0.002");
        const overrides = {
            value: price
        }
        await this.deployedContract.connect(this.addr2).whitelistMint(this.addr2.address, 1, proof, overrides);
        let result = await this.deployedContract.tokensOfOwner(this.addr2.address);
        expect(result.length).to.equal(1);
    });

    it("totalSupply should be equal to 2", async function(){
        let totalSupply = await this.deployedContract.totalSupply();
        expect(totalSupply).to.equal(2);
    });

    it("should not mint 1 NFT during the whitelist sale if max supply is exceeded", async function(){
        const leaf = keccak256(this.addr3.address);
        const proof = this.tree.getHexProof(leaf);

        let price = ethers.parseEther("0.002");
        const overrides = {
            value: price
        }

        await expect(this.deployedContract.connect(this.addr3).whitelistMint(this.addr3.address, 1, proof, overrides)).to.be.revertedWithCustomError(this.deployedContract, "MaxSupplyExceeded");
    });

    /** Public sale tests */
    it("should change the saleStartTime", async function(){
        let timestamp = parseInt(new Date().getTime() / 1000) + 30 * 3600;
        await this.deployedContract.setSaleStartTime(timestamp);
        expect(await this.deployedContract.saleStartTime()).to.equal(timestamp);
    });

    it("should not mint NFTs during the public sale if the public sale has not started yet", async function(){
        let price = ethers.parseEther("0.003");
        const overrides = {
            value: price
        }

        await expect(this.deployedContract.connect(this.addr1).publicMint(this.addr1.address, 2, overrides)).to.be.revertedWithCustomError(this.deployedContract, "PublicSaleNotActivated");
    });

    it("should change the saleStartTime", async function(){
        let timestamp = parseInt(new Date().getTime() / 1000) - 25 * 3600;
        await this.deployedContract.setSaleStartTime(timestamp);
        expect(await this.deployedContract.saleStartTime()).to.equal(timestamp);
    });

    it("should not mint NFTs during the public sale if the user tries to mint more than 3 NFTs", async function(){
        let price = ethers.parseEther("0.012");
        const overrides = {
            value: price
        }

        await expect(this.deployedContract.connect(this.addr1).publicMint(this.addr1.address, 4, overrides)).to.be.revertedWithCustomError(this.deployedContract, "AmountNFTPerWalletExceeded");
    });

    it("should mint 3 NFTs during the public sale", async function(){
        let price = ethers.parseEther("0.009");
        const overrides = {
            value: price
        }

        await this.deployedContract.connect(this.addr1).publicMint(this.addr1.address, 3, overrides);
        let tokensOfOwner = await this.deployedContract.tokensOfOwner(this.addr1.address);
        expect(tokensOfOwner.length).to.equal(4);
    });

    it("totalSupply should be equal to 5", async function(){
        let totalSupply = await this.deployedContract.totalSupply();
        expect(totalSupply).to.equal(5);
    });

    it("should not mint NFTs during the public sale if the user tries to mint more than 3 NFTs during the public sale", async function(){
        let price = ethers.parseEther("0.003");
        const overrides = {
            value: price
        }

        await expect(this.deployedContract.connect(this.addr1).publicMint(this.addr1.address, 1, overrides)).to.be.revertedWithCustomError(this.deployedContract, "AmountNFTPerWalletExceeded");
    });

    it("should not mint 1 NFT during the public sale if not enough Ether is provided", async function(){
        let price = ethers.parseEther("0.0000003");
        const overrides = {
            value: price
        }

        await expect(this.deployedContract.connect(this.addr2).publicMint(this.addr2.address, 1, overrides)).to.be.revertedWithCustomError(this.deployedContract, "NotEnoughFunds");
    });

    it("should mint 3 NFTs during the public sale", async function(){
        let price = ethers.parseEther("0.009");
        const overrides = {
            value: price
        }

        await this.deployedContract.connect(this.addr2).publicMint(this.addr2.address, 3, overrides);
        let tokensOfOwner = await this.deployedContract.tokensOfOwner(this.addr2.address);
        expect(tokensOfOwner.length).to.equal(4);
    });

    it("totalSupply should be equal to 8", async function(){
        let totalSupply = await this.deployedContract.totalSupply();
        expect(totalSupply).to.equal(8);
    });

    it("should not mint 1 NFT during the public sale because Max Supply Exceeded", async function(){
        let price = ethers.parseEther("0.003");
        const overrides = {
            value: price
        }

        await expect(this.deployedContract.connect(this.addr3).publicMint(this.addr3.address, 1, overrides)).to.be.revertedWithCustomError(this.deployedContract, "MaxSupplyExceeded");
    });

    /** GIFT */
    it("sould not be possible to gift if the public sale is not finished", async function(){
        await expect(this.deployedContract.connect(this.owner).gift(this.addr3.address, 1)).to.be.revertedWithCustomError(this.deployedContract, "GiftNotAllowed");
    });

    it("should change the saleStartTime", async function(){
        let timestamp = parseInt(new Date().getTime() / 1000) - 50 * 3600;
        await this.deployedContract.setSaleStartTime(timestamp);
        expect(await this.deployedContract.saleStartTime()).to.equal(timestamp);
    });

    it("should be possible to gift 1 NFT to an user", async function(){
        let balanceAddr3BeforeGift = await this.deployedContract.balanceOf(this.addr3.address);
        await this.deployedContract.connect(this.owner).gift(this.addr3.address, 1);
        let balanceAddr3AfterGift = await this.deployedContract.balanceOf(this.addr3.address);
        expect(balanceAddr3BeforeGift).to.be.lt(balanceAddr3AfterGift);
    });

    it("totalSupply should be equal to 9", async function(){
        let totalSupply = await this.deployedContract.totalSupply();
        expect(totalSupply).to.equal(9);
    });

    it("should be possible to gift 1 NFT to an user", async function(){
        let balanceAddr3BeforeGift = await this.deployedContract.balanceOf(this.addr3.address);
        await this.deployedContract.connect(this.owner).gift(this.addr3.address, 1);
        let balanceAddr3AfterGift = await this.deployedContract.balanceOf(this.addr3.address);
        expect(balanceAddr3BeforeGift).to.be.lt(balanceAddr3AfterGift);
    });

    it("totalSupply should be equal to 10", async function(){
        let totalSupply = await this.deployedContract.totalSupply();
        expect(totalSupply).to.equal(10);
    });

    it("should not be possible to gift 1 NFT to an user because max supply exceeded", async function(){
        await expect(this.deployedContract.gift(this.addr1.address, 1)).to.be.revertedWithCustomError(this.deployedContract, "MaxSupplyExceeded");
    });

    it("should be possible to pause the contract", async function(){
        await this.deployedContract.setPause(true);
        expect(await this.deployedContract.isPaused()).to.equal(true);
    });

    it("should not be possible to gift if the contract is paused", async function(){
        await expect(this.deployedContract.gift(this.addr1.address, 1)).to.be.revertedWith("The contract is paused");
    });

    it("should be possible to unpause the contract", async function(){
        await this.deployedContract.setPause(false);
        expect(await this.deployedContract.isPaused()).to.equal(false);
    });

    it("should be possible to get the tokenURI of the NFT number 1", async function(){
        let tokenURI = await this.deployedContract.tokenURI(1);
        expect(tokenURI).to.equal("ipfs://CID/1.json");
    });

    it('should be possible to change the baseURI', async function(){
        await this.deployedContract.setBaseURI("ipfs://newCID/");
        let baseURI = await this.deployedContract.baseURI();
        expect(baseURI).to.equal("ipfs://newCID/");
    });

    it("should change the merkle root", async function(){
        let newMerkleRoot = "0x887a9d7f2b1fca2ff8c07e1e02d906bc2cda73495a8da7494165adcd81875164";
        
        await this.deployedContract.setMerkleRoot(newMerkleRoot);
        expect(await this.deployedContract.merkleRoot()).to.equal(newMerkleRoot);
    });

    it("should release the gains of the collection", async function(){
        const lastBalanceGainAddress = await ethers.provider.getBalance(this.gainAddress);
        await this.deployedContract.releaseAll();

        const newBalanceGainAddress = await ethers.provider.getBalance(this.gainAddress);
        expect(newBalanceGainAddress).to.be.gt(lastBalanceGainAddress);
    });




});