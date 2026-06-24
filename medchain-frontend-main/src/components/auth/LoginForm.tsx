"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Wallet, ShieldCheck } from "lucide-react";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onLogin: () => void;
}

export default function LoginForm({ onSwitchToRegister, onLogin }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full max-w-md">
      {/* Mobile Logo Only */}
      <div className="lg:hidden flex items-center gap-2 mb-12 justify-center">
        <div className="w-8 h-8 bg-med-blue rounded-lg flex items-center justify-center">
          <ShieldCheck className="text-white w-5 h-5" />
        </div>
        <span className="text-med-blue font-bold text-xl tracking-tight">MedChain</span>
      </div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,74,198,0.08)] border border-gray-100"
      >
        <header className="mb-10">
          <h2 className="font-bold text-3xl text-med-text tracking-tight mb-2">Welcome Back</h2>
          <p className="text-med-secondary">Sign in to your digital sanctuary.</p>
        </header>

        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-600" htmlFor="email">
              Email Address
            </label>
            <input 
              className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-med-blue transition-all text-med-text outline-none"
              id="email" 
              name="email" 
              placeholder="dr.smith@medchain.io" 
              type="email"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-600" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <input 
                className="w-full px-4 py-3.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-med-blue transition-all text-med-text outline-none"
                id="password" 
                name="password" 
                placeholder="••••••••" 
                type={showPassword ? "text" : "password"}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-med-blue transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Utilities */}
          <div className="flex items-center justify-between py-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                className="w-5 h-5 rounded-md border-gray-300 text-med-blue focus:ring-med-blue/20 transition-all cursor-pointer" 
                type="checkbox" 
              />
              <span className="text-sm font-medium text-med-secondary group-hover:text-med-text transition-colors">
                Remember me
              </span>
            </label>
            <a className="text-sm font-semibold text-med-blue hover:text-med-light-blue transition-colors" href="#">
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button 
            className="w-full clinical-gradient text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 hover:opacity-90 active:scale-[0.98] transition-all tracking-wide"
            type="submit"
          >
            Login to Account
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest">
            <span className="bg-white px-4 text-gray-400 font-bold">OR</span>
          </div>
        </div>

        {/* Web3 Option */}
        <button 
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-med-text font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98]" 
          type="button"
        >
          <Wallet className="text-med-blue w-5 h-5" />
          Continue with Wallet
        </button>

        {/* Footer Link */}
        <footer className="mt-10 text-center">
          <p className="text-med-secondary font-medium">
            Don’t have an account? 
            <button 
              onClick={onSwitchToRegister}
              className="text-med-blue font-bold hover:underline decoration-2 underline-offset-4 ml-1"
            >
              Register
            </button>
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
