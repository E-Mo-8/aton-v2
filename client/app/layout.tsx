import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import { WalletProvider } from "@/context/WalletContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = { title: "Aton Item Market", description: "Polygon (Amoy) DApp" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-900 text-white`}>
        <WalletProvider>
          <Navbar />
          <div className="container mx-auto px-4 py-8 min-h-screen">{children}</div>
          <footer className="text-center py-4 border-t border-slate-700 text-slate-400">
            Aton Marketplace - Polygon (Amoy) - by EYALM
          </footer>
        </WalletProvider>
      </body>
    </html>
  );
}