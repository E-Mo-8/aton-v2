"use client";
import { useContext } from "react";
import { WalletContext } from "@/context/WalletContext";

export default function Home() {
  const { connectWallet, currentAccount } = useContext(WalletContext);

  return (
    <div className="flex flex-col items-center justify-center mt-20 text-center">
      <h1 className="text-5xl font-bold mb-6 text-blue-400">Welcome to Aton Market</h1>
      <p className="text-xl text-slate-500 mb-8 max-w-2xl">
        The exclusive Aton marketplace on Polygon (Amoy). 
        Admins mint, Users buy items, and anyone can trade on the secondary market.
      </p>
      {!currentAccount && (
        <button onClick={connectWallet} className="bg-blue-600 text-xl px-8 py-3 rounded-full hover:bg-blue-700 cursor-pointer">
          Connect Wallet to Begin
        </button>
      )}
    </div>
  );
}