const hre = require("hardhat");
const tokens = require("../utils/tokens.json");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

async function main(){
    let tab = [];

    tokens.map((token) => {
        tab.push(token.address);
    });

    const leaves = tab.map((address) => {
        return keccak256(address);
    });

    let tree = new MerkleTree(leaves, keccak256, { sort: true });
    let merkleTreeRoot = tree.getHexRoot();

    let baseURI = "ipfs://bafybeidxstlvmnqjfjcepkpxmiz4pw4oxpck4dcyfdlspneoifgwuhnq44/";
    const gainAddress = "0x668d54AeC3e8f24506B2a0B711052DE8905d8038";

    const NFTIsERC721A = await hre.ethers.deployContract("NFTIsERC721A", [merkleTreeRoot, baseURI, gainAddress]);

    await NFTIsERC721A.waitForDeployment();

    console.log(`NFTIsERC721A has been deployed to address : ${NFTIsERC721A.target} - MerkleRoot ${merkleTreeRoot} - baseURI ${baseURI} - gainAddress ${gainAddress}`);


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
})