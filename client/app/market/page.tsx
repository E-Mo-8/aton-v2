"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { contractAddress } from "../../config";
import NFTMarketplace from "../../context/AtonMarketplace.json";

export default function Market() {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadNFTs(); }, []);

  async function loadNFTs() {
    // Read-only provider for anonymous users
    const provider = new ethers.JsonRpcProvider("https://rpc-amoy.polygon.technology");
    const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, provider);

    const data = await contract.fetchMarketItems();
    const items = await Promise.all(data.map(async (i: any) => {
      // Only show items marked as resale
      if (i.isResale) {
        const tokenUri = await contract.tokenURI(i.tokenId);
        const meta = await axios.get(tokenUri);
        let price = ethers.formatUnits(i.price.toString(), "ether");
        return { price, tokenId: Number(i.tokenId), seller: i.seller, owner: i.owner, image: meta.data.image, name: meta.data.name, description: meta.data.description };
      }
    }));
    setNfts(items.filter(i => i !== undefined));
    setLoading(false);
  }

  async function buyNft(nft: any) {
    if (!window.ethereum) return alert("Please install MetaMask");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, signer);

    const price = ethers.parseUnits(nft.price, "ether");
    const transaction = await contract.buySecondHand(nft.tokenId, { value: price });
    await transaction.wait();
    loadNFTs();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-blue-400">Secondary Market</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {nfts.length === 0 ? <p>No items for sale.</p> : nfts.map((nft, i) => (
          <div key={i} className="border border-blue-600 bg-slate-100 rounded-xl overflow-hidden p-4">
            <img src={nft.image} className="rounded mb-2 h-48 w-full object-cover" />
            <p className="text-xl font-bold">{nft.name}</p>
            <p className="text-gray-400">{nft.description}</p>
            <p className="text-xl font-bold mt-2">{nft.price} MATIC</p>
            <button onClick={() => buyNft(nft)} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4">Buy</button>
          </div>
        ))}
      </div>
    </div>
  );
}