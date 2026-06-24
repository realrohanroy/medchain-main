"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Shield } from "lucide-react";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
  onNext: (name: string) => void;
}

export default function RegisterForm({ onSwitchToLogin, onNext }: RegisterFormProps) {
  const [name, setName] = useState("");

  return (
    <div className="w-full max-w-xl animate-in fade-in duration-500">
      {/* Registration Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,74,198,0.08)] relative overflow-hidden flex flex-col border border-gray-50"
      >
        {/* Progress Indicator Overlay */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100">
          <div className="h-full bg-med-blue w-1/3 transition-all duration-500"></div>
        </div>

        <div className="p-10 md:p-14">
          {/* Header Section */}
          <div className="mb-10 text-center">
            <span className="inline-block px-3 py-1 bg-blue-50 text-med-blue text-[10px] font-bold tracking-widest uppercase rounded-full mb-4">
              Step 1 of 3
            </span>
            <h1 className="font-bold text-3xl md:text-4xl text-med-text tracking-tight mb-4">
              Create your account
            </h1>
            <p className="text-med-secondary text-base leading-relaxed max-w-sm mx-auto">
              Start by setting up your clinical credentials with enterprise-grade security.
            </p>
          </div>

          {/* Registration Form */}
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-600 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  id="fullName"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-med-blue/20 focus:bg-white transition-all text-med-text placeholder:text-gray-400 outline-none" 
                  placeholder="Dr. Julian Pierce" 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>


            {/* Work Email */}
            <div className="space-y-2">
              <label htmlFor="workEmail" className="block text-sm font-semibold text-gray-600 ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  id="workEmail"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-med-blue/20 focus:bg-white transition-all text-med-text placeholder:text-gray-400 outline-none" 
                  placeholder="julian.pierce@medical.org" 
                  type="email"
                />
              </div>
            </div>

            {/* Password Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-600 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    id="password"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-med-blue/20 focus:bg-white transition-all text-med-text outline-none" 
                    placeholder="••••••••" 
                    type="password"
                  />
                </div>
                {/* Strength Indicator */}
                <div className="flex gap-1.5 mt-2 px-1">
                  <div className="h-1 flex-grow bg-med-blue rounded-full"></div>
                  <div className="h-1 flex-grow bg-med-blue rounded-full"></div>
                  <div className="h-1 flex-grow bg-gray-200 rounded-full"></div>
                  <div className="h-1 flex-grow bg-gray-200 rounded-full"></div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-600 ml-1">Confirm Password</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    id="confirmPassword"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-0 rounded-2xl focus:ring-2 focus:ring-med-blue/20 focus:bg-white transition-all text-med-text outline-none" 
                    placeholder="••••••••" 
                    type="password"
                  />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <button 
              onClick={() => onNext(name)}
              disabled={!name.trim()}
              className="w-full clinical-gradient text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20 active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed" 
              type="button"
            >
              Next
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <p className="text-med-secondary text-sm">
              Already have an account? 
              <button 
                onClick={onSwitchToLogin}
                className="text-med-blue font-bold hover:underline ml-1"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
        
        {/* Vitality Glass Accent */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-[100px] pointer-events-none"></div>
      </motion.div>
    </div>
  );
}
