"use client";
import { useState, useContext } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { contractAddress, pinataJwt } from "../../config";
import NFTMarketplace from "../../context/AtonMarketplace.json";
import { WalletContext } from "@/context/WalletContext";

export default function AdminPage() {
  const { isAdmin } = useContext(WalletContext);
  const [formInput, updateFormInput] = useState({ price: "", name: "", order: "", country: "", buyer: "" });
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onChange(e: any) {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", formData, {
        headers: { Authorization: `Bearer ${pinataJwt}` },
      });
      setFileUrl(`https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`);
    } catch (error) {
      console.log("Error uploading file: ", error);
    }
    setUploading(false);
  }

  async function listNFT() {
    const { name, price, order, country, buyer } = formInput;
    if (!name || !price || !fileUrl || !buyer) return;

    // 1. Upload Metadata JSON
    const metadata = JSON.stringify({
      name, description: `Order: ${order}, Country: ${country}`, 
      image: fileUrl, 
      attributes: [{ trait_type: "Country", value: country }, { trait_type: "Order", value: order }]
    });

    try {
      const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", metadata, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${pinataJwt}` },
      });
      const tokenURI = `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`;

      // 2. Call Contract
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, signer);

      const priceFormatted = ethers.parseUnits(price, "ether");
      let transaction = await contract.createToken(tokenURI, priceFormatted, buyer);
      await transaction.wait();
      alert("Item Listed Successfully!");
    } catch (e) {
      console.error(e);
      alert("Error listing Item");
    }
  }

  if (!isAdmin) return <p>Access Denied</p>;

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12 gap-4">
        <h2 className="text-3xl font-bold">List New Item</h2>
        <input placeholder="Item Name" className="p-2 rounded text-black" onChange={e => updateFormInput({ ...formInput, name: e.target.value })} />
        <input placeholder="Order Number" className="p-2 rounded text-black" onChange={e => updateFormInput({ ...formInput, order: e.target.value })} />
        <input placeholder="Country" className="p-2 rounded text-black" onChange={e => updateFormInput({ ...formInput, country: e.target.value })} />
        <input placeholder="Buyer Address (0x...)" className="p-2 rounded text-black" onChange={e => updateFormInput({ ...formInput, buyer: e.target.value })} />
        <input placeholder="Price in MATIC" className="p-2 rounded text-black" onChange={e => updateFormInput({ ...formInput, price: e.target.value })} />
        <input type="file" name="Asset" className="my-4 cursor-pointer" onChange={onChange} />
        {fileUrl && <img className="rounded mt-4" width="350" src={fileUrl} />}
        <button onClick={listNFT} className="font-bold mt-4 bg-blue-600 text-white rounded p-4 shadow-lg cursor-pointer">{uploading ? "Uploading..." : "List Item"}</button>
      </div>
    </div>
  );
}