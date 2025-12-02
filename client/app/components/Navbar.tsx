"use client";
import Link from "next/link";
import { useContext } from "react";
import { WalletContext } from "@/context/WalletContext";

export default function Navbar() {
  const { currentAccount, connectWallet, isAdmin } = useContext(WalletContext);

  return (
    <nav className="flex justify-between items-center p-6 bg-slate-800 border-b border-slate-700">
      <Link href="/" className="text-2xl font-bold text-blue-400">Aton Market</Link>
      <div className="flex gap-6">
                {isAdmin && (
          <div className="flex gap-4 bg-slate-700 px-4 py-1 rounded-full">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Admin:</span>
            <Link href="/admin" className="hover:text-white text-blue-200">List New</Link>
            <Link href="/admin/assignments" className="hover:text-white text-blue-200">View Assignments</Link>
          </div>
        )}
        {currentAccount && <div className="flex gap-4 bg-slate-700 px-4 py-1 rounded-full"><Link className="text-blue-200" href="/dashboard">My Items</Link></div>}
        <div className="flex gap-4 bg-slate-700 px-4 py-1 rounded-full"><Link className="text-blue-200" href="/market">Public Market</Link></div>
      </div>
      <button 
        onClick={connectWallet}
        className="bg-blue-600 00 px-4 py-2 rounded hover:bg-blue-700 transition cursor-pointer"
      >
        {currentAccount ? `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}` : "Connect Wallet"}
      </button>
    </nav>
  );
}