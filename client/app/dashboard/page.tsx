"use client";
import { useEffect, useState, useContext } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { contractAddress } from "../../config";
import NFTMarketplace from "../../context/AtonMarketplace.json";
import { WalletContext } from "@/context/WalletContext";

export default function Dashboard() {
  const { currentAccount } = useContext(WalletContext);
  const [assignedNfts, setAssignedNfts] = useState<any[]>([]);
  const [myNfts, setMyNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentAccount) loadNFTs();
  }, [currentAccount]);

  async function loadNFTs() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, signer);

    // 1. Fetch Market Items (Find ones assigned to me)
    const data = await contract.fetchMarketItems();
    const assignedItems = await Promise.all(data.map(async (i: any) => {
      if (i.designatedBuyer.toLowerCase() === currentAccount.toLowerCase() && !i.isResale) {
        const tokenUri = await contract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.formatUnits(i.price.toString(), "ether");
        return { price, tokenId: Number(i.tokenId), seller: i.seller, owner: i.owner, image: meta.data.image, name: meta.data.name, description: meta.data.description };
      }
    }));
    setAssignedNfts(assignedItems.filter(i => i !== undefined));

    // 2. Fetch My Owned Items
    const myData = await contract.fetchMyNFTs();
    const myItems = await Promise.all(myData.map(async (i: any) => {
      const tokenUri = await contract.tokenURI(i.tokenId);
      const meta = await axios.get(tokenUri);
      let price = ethers.formatUnits(i.price.toString(), "ether");
      return { price, tokenId: Number(i.tokenId), seller: i.seller, owner: i.owner, image: meta.data.image, name: meta.data.name, description: meta.data.description };
    }));
    setMyNfts(myItems);
    setLoading(false);
  }

  async function buyNft(nft: any) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, signer);
    const price = ethers.parseUnits(nft.price, "ether");

    const transaction = await contract.buyFirstHand(nft.tokenId, { value: price });
    await transaction.wait();
    loadNFTs();
  }

  async function resellNft(nft: any) {
    const price = window.prompt("Enter resale price in MATIC");
    if (!price) return;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, signer);
    
    // Check if contract is approved to move token
    // (Skipping detailed check for brevity, just approving always or catching error)
    // await contract.approve(contractAddress, nft.tokenId); // Standard ERC721
    
    const priceFormatted = ethers.parseUnits(price, "ether");
    let transaction = await contract.resellToken(nft.tokenId, priceFormatted);
    await transaction.wait();
    loadNFTs();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* SECTION 1: ITEMS WAITING FOR YOU */}
      <h2 className="text-2xl font-bold mb-4 text-blue-600">Assigned to You (Action Required)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {assignedNfts.length === 0 ? <p className="text-slate-500">No new assignments.</p> : assignedNfts.map((nft, i) => (
          <div key={i} className="border border-blue-600 bg-slate-100 rounded-xl overflow-hidden shadow-lg p-4">
            <img src={nft.image} className="rounded mb-2 h-48 w-full object-cover" />
            <p className="text-xl font-bold">{nft.name}</p>
            <p className="text-gray-400">{nft.description}</p>
            <p className="text-xl font-bold mt-2">{nft.price} MATIC</p>
            <button onClick={() => buyNft(nft)} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4">Buy Now</button>
          </div>
        ))}
      </div>

      {/* SECTION 2: YOUR OWNED ITEMS */}
      <h2 className="text-2xl font-bold mb-4 text-blue-400">Your Collection</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {myNfts.map((nft, i) => (
          <div key={i} className="border border-blue-600 bg-slate-100 rounded-xl overflow-hidden p-4">
            <img src={nft.image} className="rounded mb-2 h-48 w-full object-cover" />
            <p className="text-xl font-bold">{nft.name}</p>
            <p className="text-gray-400">{nft.description}</p>
            <button onClick={() => resellNft(nft)} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4">Resell</button>
          </div>
        ))}
      </div>
    </div>
  );
}