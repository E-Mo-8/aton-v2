"use client";
import React, { createContext, useState, useEffect } from "react";
import { ethers } from "ethers";

export const WalletContext = createContext<any>(null);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Hardcode the admin address (the one you deployed with)
  const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || "";

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setCurrentAccount(accounts[0]);
    checkAdmin(accounts[0]);
  };

  const checkWallet = async () => {
    if (!window.ethereum) return;
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (accounts.length) {
      setCurrentAccount(accounts[0]);
      checkAdmin(accounts[0]);
    }
  };

const checkAdmin = (address: string) => {
    const envAdmin = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;
    
    console.log("--- DEBUG ADMIN CHECK ---");
    console.log("1. Connected Wallet:", address);
    console.log("2. Env Var Address :", envAdmin);
    
    if (!envAdmin) {
        console.error("ERROR: .env variable is missing or empty!");
        return;
    }

    // Clean strings to ensure no hidden spaces match
    const cleanAddress = address.trim().toLowerCase();
    const cleanEnvAdmin = envAdmin.trim().toLowerCase();

    if(cleanAddress === cleanEnvAdmin) {
        console.log("✅ SUCCESS: Addresses Match. Setting Admin to TRUE.");
        setIsAdmin(true);
    } else {
        console.log("❌ FAIL: Addresses do not match.");
        setIsAdmin(false);
    }
  }

  useEffect(() => {
    checkWallet();
  }, []);

  return (
    <WalletContext.Provider value={{ currentAccount, connectWallet, isAdmin }}>
      {children}
    </WalletContext.Provider>
  );
};