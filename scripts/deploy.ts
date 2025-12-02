import { ethers } from "hardhat";

async function main() {
  const NFTMarketplace = await ethers.getContractFactory("AtonMarketplace");
  const nftMarketplace = await NFTMarketplace.deploy();

  await nftMarketplace.waitForDeployment();

  console.log("AtonMarketplace deployed to:", await nftMarketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});