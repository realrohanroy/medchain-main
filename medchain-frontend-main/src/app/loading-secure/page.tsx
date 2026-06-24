'use client';

import { ShieldHalf, Lock, UserCircle, Stethoscope, CheckCircle2 } from 'lucide-react';

export default function LoadingSecure() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-[#F8FAFC] to-[#EEF2F6] flex flex-col items-center justify-center relative overflow-hidden">
            
            {/* Background animated rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-slate-100 rounded-full opacity-50 animate-[spin_60s_linear_infinite]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-50 rounded-full opacity-60 animate-[spin_40s_linear_infinite_reverse]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-blue-100 rounded-full opacity-70 animate-[spin_20s_linear_infinite]"></div>

            <div className="relative z-10 flex flex-col items-center">
                
                {/* Logo */}
                <div className="flex items-center gap-3 mb-24">
                    <div className="bg-blue-600 rounded-xl p-2.5 text-white shadow-md">
                        <ShieldHalf className="w-8 h-8" />
                    </div>
                    <span className="text-3xl font-extrabold tracking-tight text-blue-600">MedChain</span>
                </div>

                {/* Loading Indicator */}
                <div className="relative w-28 h-28 mb-12 flex items-center justify-center">
                    {/* Outer animated ring */}
                    <svg className="absolute w-full h-full animate-spin text-blue-600" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="80 200" strokeLinecap="round" className="opacity-100"></circle>
                        <circle cx="50" cy="50" r="46" fill="none" stroke="#E2E8F0" strokeWidth="3" className="opacity-50"></circle>
                    </svg>
                    
                    {/* Inner static background */}
                    <div className="absolute w-[100px] h-[100px] bg-slate-100 rounded-full border border-slate-200 shadow-inner flex items-center justify-center">
                        <Lock className="w-6 h-6 text-blue-600" />
                    </div>
                </div>

                {/* Text */}
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
                    Redirecting...
                </h1>
                <p className="text-[15px] font-medium text-slate-600 text-center leading-relaxed">
                    Securing your encrypted clinical environment.<br/>
                    Please do not close this window.
                </p>

                {/* Protocol Badge */}
                <div className="mt-20 mb-8 bg-white border border-slate-200 shadow-sm rounded-full px-5 py-2 flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[10px] font-extrabold tracking-widest text-slate-600 uppercase">
                        HIPAA COMPLIANT PROTOCOL V4.2
                    </span>
                </div>

                {/* Portals fade out */}
                <div className="flex items-center gap-16 opacity-30 mt-4">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                            <UserCircle className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">Patient Portal</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                            <Stethoscope className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">Clinician Hub</span>
                    </div>
                </div>

            </div>

        </div>
    );
}
