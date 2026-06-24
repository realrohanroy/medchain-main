'use client';

import { useState, useEffect } from 'react';
import {
    Pencil, Copy, Droplets, AlertTriangle, Edit3, Bell, Shield,
    Fingerprint, Key, ChevronRight, UserCircle, Loader2,
    CheckCircle2, ChevronDown, User, Lock, Puzzle, HelpCircle,
    LogOut, Smartphone, History
} from "lucide-react"
import { authApi } from '@/lib/api/auth';

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState('personal');
    const [reminders, setReminders] = useState(true);
    const [results, setResults] = useState(true);

    const [userProfile, setUserProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const profile = await authApi.getProfile();
                setUserProfile(profile);
            } catch (err) {
                console.error("Failed to load profile", err);
                setError('Could not load profile. Please re-login.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // Derive display name: prefer first+last name, fall back to email
    const displayName = userProfile?.first_name || userProfile?.last_name
        ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
        : userProfile?.email
            ? userProfile.email.split('@')[0]
            : 'Unknown User';

    const isDoctor = userProfile?.role === 'DOCTOR';
    const accentColor = isDoctor ? 'emerald' : 'blue';
    const renderId = userProfile?.id
        ? String(userProfile.id).substring(0, 8).toUpperCase()
        : '--------';

    if (loading) {
        return (
            <div className="min-h-full flex flex-col items-center justify-center p-20 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p className="font-bold">Loading your profile...</p>
            </div>
        );
    }

    if (error && !userProfile) {
        return (
            <div className="min-h-full flex flex-col items-center justify-center p-20 text-red-500">
                <AlertTriangle className="w-8 h-8 mb-4" />
                <p className="font-bold">{error}</p>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-slate-50/50 pb-20 relative">
            <div className="flex-1 p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500 mt-2 space-y-8">

                {/* Header Section */}
                <div className="space-y-2 mb-10">
                    <h2 className="text-[2.25rem] font-bold tracking-tight text-slate-900 leading-tight">
                        {isDoctor ? 'Provider Profile' : 'Patient Profile'}
                    </h2>
                    <p className="text-[15px] font-medium text-slate-500">
                        Manage your centralized health identity and clinical settings.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-8">

                    {/* Left Column */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col items-center text-center pb-8">
                            <div className="relative mb-6 group cursor-pointer">
                                <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${isDoctor ? 'border-emerald-600' : 'border-slate-900'} bg-slate-100 shadow-sm flex items-center justify-center`}>
                                    <UserCircle className="w-24 h-24 text-slate-300" strokeWidth={1} />
                                </div>
                            </div>

                            <h3 className="text-[1.35rem] font-bold text-slate-900 mb-1">{displayName}</h3>
                            <p className="text-[12px] font-medium text-slate-500 mb-2">
                                {isDoctor ? 'Provider' : 'Patient'} • {userProfile?.email}
                            </p>
                            <p className="text-[11px] font-mono text-slate-400 mb-8">
                                ID: #{renderId}
                            </p>

                            <div className="bg-slate-50 w-full rounded-[1rem] p-4 flex items-center justify-between border border-slate-100/80 group hover:border-slate-200 hover:bg-slate-100/50 transition-colors cursor-pointer"
                                onClick={() => {
                                    if (userProfile?.id) {
                                        navigator.clipboard.writeText(String(userProfile.id));
                                    }
                                }}
                            >
                                <div>
                                    <p className="text-[9px] font-extrabold text-slate-400 tracking-wider uppercase mb-1.5 text-left">USER ID</p>
                                    <p className={`text-[12px] font-bold text-${accentColor}-600 tracking-wide font-mono`}>
                                        {userProfile?.id ? String(userProfile.id) : 'N/A'}
                                    </p>
                                </div>
                                <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <Copy className="w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {/* Quick Vitals (Patient Only) */}
                        {!isDoctor && (
                            <div className="bg-slate-50 rounded-[2rem] p-7 border border-slate-100/80">
                                <h4 className="text-[14px] font-bold text-slate-900 mb-5 pl-1">Quick Vitals</h4>
                                <div className="space-y-3">
                                    <div className="bg-white p-4 rounded-[1.25rem] flex items-center justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] border border-slate-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                <Droplets className="w-4 h-4" />
                                            </div>
                                            <span className="text-[13px] font-bold text-slate-700">Blood Type</span>
                                        </div>
                                        <span className="text-[13px] font-bold text-blue-600">Pending</span>
                                    </div>

                                    <div className="bg-white p-4 rounded-[1.25rem] flex items-center justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] border border-slate-100/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-orange-50 text-[#cc5500] flex items-center justify-center shrink-0">
                                                <AlertTriangle className="w-4 h-4" />
                                            </div>
                                            <span className="text-[13px] font-bold text-slate-700">Allergies</span>
                                        </div>
                                        <span className="text-[13px] font-bold text-[#cc5500]">None Recorded</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">

                        {/* Tabs */}
                        <div className="bg-white border border-slate-100 shadow-sm p-1.5 rounded-[1.25rem] flex items-center mb-8">
                            <button
                                onClick={() => setActiveTab('personal')}
                                className={`flex-1 py-3.5 text-[14px] font-bold rounded-xl transition-all ${activeTab === 'personal' ? 'bg-white text-blue-600 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Personal Info
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`flex-1 py-3.5 text-[14px] font-bold rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm border border-slate-100/50' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Settings
                            </button>
                        </div>

                        {/* Identity & Contact Card */}
                        {activeTab === 'personal' && (
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 animate-in fade-in duration-300">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[18px] font-bold text-slate-900">Identity & Contact</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">First Name</label>
                                        <div className="w-full bg-slate-50/80 border border-slate-100/80 text-slate-900 text-[14px] font-medium p-3.5 rounded-xl">
                                            {userProfile?.first_name || <span className="text-slate-400 italic">Not set</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Last Name</label>
                                        <div className="w-full bg-slate-50/80 border border-slate-100/80 text-slate-900 text-[14px] font-medium p-3.5 rounded-xl">
                                            {userProfile?.last_name || <span className="text-slate-400 italic">Not set</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Email Address</label>
                                        <div className="w-full bg-slate-50/80 border border-slate-100/80 text-slate-900 text-[14px] font-medium p-3.5 rounded-xl">
                                            {userProfile?.email || <span className="text-slate-400 italic">N/A</span>}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Role</label>
                                        <div className="w-full bg-slate-50/80 border border-slate-100/80 text-slate-900 text-[14px] font-medium p-3.5 rounded-xl capitalize">
                                            {userProfile?.role?.toLowerCase() || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">

                                {/* Notifications */}
                                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[15px] font-bold text-slate-900">Notifications</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between cursor-pointer" onClick={() => setReminders(!reminders)}>
                                            <span className="text-[13px] font-medium text-slate-700">Appointment Reminders</span>
                                            <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${reminders ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'}`}>
                                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between cursor-pointer" onClick={() => setResults(!results)}>
                                            <span className="text-[13px] font-medium text-slate-700">New Test Results</span>
                                            <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 shrink-0 ${results ? 'bg-blue-600 justify-end' : 'bg-slate-200 justify-start'}`}>
                                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Security Options */}
                                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                        <h3 className="text-[15px] font-bold text-slate-900">Security Options</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-3 text-slate-400 group-hover:text-blue-600 transition-colors">
                                                <Fingerprint className="w-4 h-4" />
                                                <span className="text-[13px] font-medium text-slate-700">Biometric Authentication</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                        <div className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-3 text-slate-400 group-hover:text-blue-600 transition-colors">
                                                <Key className="w-4 h-4" />
                                                <span className="text-[13px] font-medium text-slate-700">Two-Factor Auth (2FA)</span>
                                            </div>
                                            <span className="bg-[#fff5f0] text-[#cc5500] px-3 py-1 rounded-[0.4rem] text-[9px] font-black tracking-wider shadow-sm border border-[#fff5f0]">OFF</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    )
}
