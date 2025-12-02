"use client";
import { useEffect, useState, useContext } from "react";
import { ethers } from "ethers";
import axios from "axios";
import { contractAddress } from "../../../config";
import NFTMarketplace from "../../../context/AtonMarketplace.json";
import { WalletContext } from "@/context/WalletContext";

export default function AdminAssignments() {
    const { isAdmin } = useContext(WalletContext);
    const [nfts, setNfts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAdmin) loadNFTs();
    }, [isAdmin]);

    async function loadNFTs() {
        // 1. Setup Provider (Read-only is fine for fetching, but we use BrowserProvider to be safe)
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(contractAddress, NFTMarketplace.abi, signer);

        // 2. Fetch all unsold market items
        const data = await contract.fetchMarketItems();

        // 3. Filter and Map Data
        const items = await Promise.all(data.map(async (i: any) => {
            // Logic: If designatedBuyer is NOT the "Zero Address" (0x000...), it is assigned.
            if (i.designatedBuyer !== ethers.ZeroAddress) {
                const tokenUri = await contract.tokenURI(i.tokenId);
                const meta = await axios.get(tokenUri);
                // Extract Attributes (Order & Country)
                const attributes = meta.data.attributes || [];
                const getAttr = (key: string) => attributes.find((a: any) => a.trait_type === key)?.value || "N/A";

                let price = ethers.formatUnits(i.price.toString(), "ether");

                return {
                    price,
                    tokenId: Number(i.tokenId),
                    seller: i.seller,
                    designatedBuyer: i.designatedBuyer,
                    image: meta.data.image,
                    name: meta.data.name,
                    description: meta.data.description,
                    order: getAttr("Order"),
                    country: getAttr("Country")
                };
            }
        }));

        // Remove undefined items (the ones that were filtered out)
        setNfts(items.filter((i) => i !== undefined));
        setLoading(false);
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Address copied!");
    };

    if (!isAdmin) return <div className="text-center mt-10">Access Denied</div>;
    if (loading) return <div className="text-center mt-10">Loading assignments...</div>;

    return (
        <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-blue-400">Items Status</h2>

            {nfts.length === 0 ? (
                <p className="text-gray-400">No active assignments found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-slate-800 rounded-lg overflow-hidden">
                        <thead className="bg-slate-700 text-gray-200">
                            <tr>
                                <th className="py-3 px-4 text-left text-base">Item</th>
                                <th className="py-3 px-4 text-left text-base">Token ID</th>
                                <th className="py-3 px-4 text-left">Order #</th>
                                <th className="py-3 px-4 text-left">Country</th>
                                <th className="py-3 px-4 text-left text-base">Price</th>
                                <th className="py-3 px-4 text-left text-base">Buyer Address</th>
                                <th className="py-3 px-4 text-left text-base">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-500 divide-y divide-slate-700">
                            {nfts.map((nft, index) => (
                                <tr key={index} className="hover:bg-slate-300 bg-slate-200">
                                    <td className="py-3 px-4 flex items-center gap-3">
                                        <img src={nft.image} className="w-12 h-12 rounded object-cover" alt="icon" />
                                        <span className="font-bold">{nft.name}</span>
                                    </td>
                                    <td className="py-3 px-4 font-mono">#{nft.tokenId}</td>
                                    <td className="py-3 px-4 font-mono">{nft.order}</td>
                                    <td className="py-3 px-4">{nft.country}</td>
                                    

                                    <td className="py-3 px-4">{nft.price} POL</td>
                                    <td className="py-3 px-4 font-mono text-sm text-blue-500">
                                        {nft.designatedBuyer
                                            ? `${nft.designatedBuyer.substring(0, 4)}...${nft.designatedBuyer.slice(-4)}`
                                            : ""}
                                    </td>
                                    <td className="py-3 px-4">
                                        <button
                                            onClick={() => copyToClipboard(nft.designatedBuyer)}
                                            className="bg-slate-600 hover:bg-slate-500 text-xs text-white py-1 px-3 rounded cursor-pointer"
                                        >
                                            Copy Address
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}