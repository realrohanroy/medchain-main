"use client";

import { useState } from "react";
import { User, BriefcaseMedical, CheckCircle2, ArrowLeft } from "lucide-react";

interface RoleSelectionProps {
  onBack: () => void;
  onContinue: (role: string) => void;
}

export default function RoleSelection({ onBack, onContinue }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<"patient" | "provider" | null>("provider");

  return (
    <div className="max-w-4xl w-full animate-in fade-in duration-500">
      {/* Step Indicator */}
      <div className="mb-12 text-center">
        <div className="inline-flex items-center space-x-4 mb-4">
          <div className="h-1.5 w-12 rounded-full bg-blue-100"></div>
          <div className="h-1.5 w-24 rounded-full bg-med-blue"></div>
          <div className="h-1.5 w-12 rounded-full bg-gray-100"></div>
        </div>
        <p className="text-med-secondary text-sm tracking-widest uppercase font-semibold">Step 2 of 3</p>
        <h1 className="font-bold text-4xl md:text-5xl text-med-text mt-4 tracking-tight">Define your role</h1>
        <p className="text-med-secondary mt-4 max-w-md mx-auto">Select the identity that best describes your interaction with the MedChain network.</p>
      </div>

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Patient Card */}
        <button 
          onClick={() => setSelectedRole("patient")}
          className={`group relative flex flex-col text-left p-8 bg-white border-2 rounded-[2rem] transition-all duration-300 ${
            selectedRole === "patient" 
              ? "border-med-blue shadow-[0_10px_30px_-10px_rgba(0,74,198,0.15)]" 
              : "border-transparent hover:border-gray-200"
          }`}
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-colors ${
            selectedRole === "patient" ? "bg-med-blue text-white" : "bg-blue-50 text-med-blue"
          }`}>
            <User className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-2xl text-med-text mb-3">Patient Sanctuary</h3>
          <p className="text-med-secondary leading-relaxed">Access your encrypted medical history, manage appointments, and control your data sovereignty.</p>
          
          {selectedRole === "patient" && (
            <div className="absolute top-6 right-6">
              <CheckCircle2 className="text-med-blue w-6 h-6 fill-med-blue text-white" />
            </div>
          )}
        </button>

        {/* Provider Card */}
        <button 
          onClick={() => setSelectedRole("provider")}
          className={`group relative flex flex-col text-left p-8 bg-white border-2 rounded-[2rem] transition-all duration-300 ${
            selectedRole === "provider" 
              ? "border-med-blue shadow-[0_10px_30px_-10px_rgba(0,74,198,0.15)]" 
              : "border-transparent hover:border-gray-200"
          }`}
        >
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-colors ${
            selectedRole === "provider" ? "bg-med-blue text-white" : "bg-blue-50 text-med-blue"
          }`}>
            <BriefcaseMedical className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-2xl text-med-text mb-3">Medical Practitioner</h3>
          <p className="text-med-secondary leading-relaxed">Manage patient registries, verify records on-chain, and collaborate within a zero-trust environment.</p>
          
          {selectedRole === "provider" && (
            <div className="absolute top-6 right-6">
              <CheckCircle2 className="text-med-blue w-6 h-6 fill-med-blue text-white" />
            </div>
          )}
        </button>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center space-y-6">
        <button 
          onClick={() => selectedRole && onContinue(selectedRole)}
          disabled={!selectedRole}
          className="w-full md:w-auto md:min-w-[240px] px-8 py-4 clinical-gradient text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
        <button 
          onClick={onBack}
          className="text-med-blue font-semibold hover:text-med-light-blue transition-colors flex items-center group"
        >
          <ArrowLeft className="mr-2 w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>
      </div>
    </div>
  );
}
