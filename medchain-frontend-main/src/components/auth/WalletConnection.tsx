"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Wallet, ArrowLeft, ArrowRight, Link as LinkIcon, Info, ShieldCheck } from "lucide-react";

interface WalletConnectionProps {
  onBack: () => void;
  onComplete: (walletAddress: string) => void;
}

export default function WalletConnection({ onBack, onComplete }: WalletConnectionProps) {
  const [walletAddress, setWalletAddress] = useState("");

  return (
    <div className="w-full max-w-2xl animate-in fade-in duration-500">
      {/* Step Progress Indicator */}
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-1 rounded-full bg-med-blue/20"></div>
          <div className="w-10 h-1 rounded-full bg-med-blue/20"></div>
          <div className="w-16 h-1 rounded-full clinical-gradient shadow-sm"></div>
        </div>
        <span className="text-med-secondary text-sm font-semibold tracking-widest uppercase">Step 3 of 3</span>
      </div>

      {/* Central Registration Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,74,198,0.08)] p-8 md:p-12 border border-gray-50 relative overflow-hidden"
      >
        <div className="text-center mb-12">
          <h1 className="font-bold text-4xl text-med-text tracking-tight mb-4">Secure your vault</h1>
          <p className="text-med-secondary text-lg leading-relaxed max-w-md mx-auto">
            Connect your decentralized wallet to enable blockchain-verified security for your sensitive medical records.
          </p>
        </div>

        <div className="space-y-8">
          {/* Wallet Connect Option 1: Direct Provider */}
          <button 
            onClick={() => onComplete("0x_metamask_demo")}
            className="w-full group bg-med-text text-white rounded-2xl p-5 flex items-center justify-between transition-all hover:ring-4 hover:ring-med-text/10 active:scale-[0.98]">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Wallet className="w-7 h-7" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Connect MetaMask</p>
                <p className="text-white/60 text-sm">Use browser extension wallet</p>
              </div>
            </div>
            <ArrowRight className="group-hover:translate-x-1 transition-transform w-5 h-5" />
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs font-bold uppercase tracking-widest">or manual input</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {/* Wallet Connect Option 2: Manual Input */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-med-secondary ml-1" htmlFor="wallet-address">
              Wallet Address (Public Key)
            </label>
            <div className="relative group">
              <input 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-6 font-mono text-sm focus:ring-4 focus:ring-med-blue/10 focus:border-med-blue transition-all outline-none" 
                id="wallet-address" 
                placeholder="0x..." 
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">
                <LinkIcon size={20} />
              </div>
            </div>
            <p className="text-xs text-med-secondary/70 italic ml-1 flex items-center gap-1">
              <Info size={14} />
              Enter your Ethereum-compatible address for medical hash verification.
            </p>
          </div>

          {/* Visual Reinforcement / Identity Check */}
          <div className="bg-gray-50 rounded-2xl p-6 flex items-start gap-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ShieldCheck className="text-med-blue w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-med-text text-sm">Privacy Guarantee</h4>
              <p className="text-xs text-med-secondary mt-1">
                MedChain never stores your private keys. Your wallet is only used to sign transactions and verify ownership of your health data.
              </p>
            </div>
          </div>

          {/* Primary Action */}
          <div className="pt-6">
            <button 
              onClick={() => onComplete(walletAddress || "0x_metamask_demo")}
              disabled={!walletAddress}
              className="w-full clinical-gradient text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Account
            </button>
          </div>
        </div>
        
        {/* Vitality Glass Accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-[100px] pointer-events-none"></div>
      </motion.div>

      {/* Back Link */}
      <div className="mt-8 text-center">
        <button 
          onClick={onBack}
          className="text-med-secondary font-semibold text-sm hover:text-med-blue transition-colors inline-flex items-center gap-2 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Previous: Role Selection
        </button>
      </div>
    </div>
  );
}
