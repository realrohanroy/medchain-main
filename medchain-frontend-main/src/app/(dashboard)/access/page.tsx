'use client';

import { useState, useEffect } from 'react';
import {
    ShieldCheck, Lock, FileText, Search, Bell, Settings, User, Globe, AlertCircle,
    ActivitySquare, CheckCircle2, XCircle, Unlock
} from "lucide-react"
import { accessApi, AccessRequestModel, AccessGrantModel } from '@/lib/api/access';
import { sharingApi } from '@/lib/api/sharing';

export default function AccessControlPage() {
    const [activeTab, setActiveTab] = useState('my-records');
    const [requests, setRequests] = useState<AccessRequestModel[]>([]);
    const [grants, setGrants] = useState<AccessGrantModel[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAccessData = async () => {
        try {
            const [reqs, gs] = await Promise.all([
                accessApi.getRequests(),
                accessApi.getGrants()
            ]);
            setRequests(reqs);
            setGrants(gs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccessData();
    }, []);

    const handleGrantAccess = async () => {
        try {
            const res = await sharingApi.generateToken();
            await navigator.clipboard.writeText(res.share_url);
            alert(`Secure Medical Records Link Generated and Copied! 🔐\n\nProvide this securely to your healthcare professional: \n${res.share_url}\n\n(Expires on ${new Date(res.expires_at).toLocaleString()})`);
        } catch (err) {
            console.error(err);
            alert('Failed to generate immutable sharing token.');
        }
    };

    const handleAuditLog = () => {
        alert('Decentralized Audit Logging feature is currently scheduled for the upcoming MedChain v2.0 upgrade. ✨');
    };

    return (
        <div className="min-h-full bg-slate-50/50 pb-20 relative">
            <div className="flex-1 p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500 mt-2 space-y-10">

                {/* Header Section */}
                <div className="space-y-6">
                    <div className="text-[13px] font-bold text-slate-400 tracking-wider uppercase">
                        Privacy Management
                    </div>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="max-w-2xl">
                            <h2 className="text-[2.75rem] font-bold tracking-tight text-slate-900 leading-[1.15]">
                                Secure your medical data with <br />
                                <span className="text-blue-600">blockchain verified</span> permissions.
                            </h2>
                        </div>
                        <div className="pt-2 flex items-center bg-slate-100 p-1.5 rounded-full border border-slate-200/50">
                            <button className="px-5 py-2 bg-white text-blue-600 font-bold text-[13px] rounded-full shadow-sm">
                                Active
                            </button>
                            <button onClick={handleAuditLog} className="px-5 py-2 text-slate-500 hover:text-slate-800 font-bold text-[13px] rounded-full transition-colors">
                                Audit Log
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-8 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab('my-records')}
                        className={`pb-4 px-1 text-[15px] font-bold transition-all border-b-2 ${activeTab === 'my-records'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        My Records
                    </button>
                    <button
                        onClick={() => setActiveTab('authorized-doctors')}
                        className={`pb-4 px-1 text-[15px] font-bold transition-all border-b-2 ${activeTab === 'authorized-doctors'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        Authorized Doctors
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`pb-4 px-1 text-[15px] font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'requests'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                    >
                        Requests
                        <span className={`${requests.filter(r => r.status === 'Pending').length > 0 ? 'bg-[#b56b3e]' : 'bg-slate-300'} text-white text-[10px] px-2 py-0.5 rounded-full`}>
                            {requests.filter(r => r.status === 'Pending').length}
                        </span>
                    </button>
                </div>

                {/* Records Grid */}
                {activeTab === 'my-records' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Card 1 */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100/80 group hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col justify-between min-h-[220px]">
                        <div>
                            <div className="flex justify-between items-start mb-5">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-400 text-[10px] font-extrabold tracking-wider rounded-md uppercase">CONFIDENTIAL</span>
                            </div>
                            <h3 className="text-[17px] font-bold text-slate-900 mb-1">Cardiology Summary</h3>
                            <p className="text-[12px] font-medium text-slate-500 mb-5">Last updated Oct 12, 2023</p>

                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-3">
                                    <img src="https://i.pravatar.cc/150?img=47" className="w-8 h-8 rounded-full border-2 border-white object-cover bg-slate-100" alt="Doctor" />
                                    <img src="https://i.pravatar.cc/150?img=11" className="w-8 h-8 rounded-full border-2 border-white object-cover bg-slate-100" alt="Doctor" />
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                        +1
                                    </div>
                                </div>
                                <span className="text-[12px] font-medium text-slate-500">3 Shared Access</span>
                            </div>
                        </div>
                        <button onClick={handleGrantAccess} className="w-full mt-6 py-2.5 font-bold text-[13px] text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-50 active:scale-95 transition-all">
                            Grant Access
                        </button>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100/80 group hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col justify-between min-h-[220px]">
                        <div>
                            <div className="flex justify-between items-start mb-5">
                                <div className="w-10 h-10 bg-[#fff5f0] text-[#b56b3e] rounded-full flex items-center justify-center">
                                    <Search className="w-5 h-5" />
                                </div>
                                <span className="px-3 py-1 bg-[#fff5f0] text-[#b56b3e] text-[10px] font-extrabold tracking-wider rounded-md uppercase">PRIVATE</span>
                            </div>
                            <h3 className="text-[17px] font-bold text-slate-900 mb-1">Full Blood Count</h3>
                            <p className="text-[12px] font-medium text-slate-500 mb-5">Last updated Sep 28, 2023</p>

                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-3">
                                    <img src="https://i.pravatar.cc/150?img=47" className="w-8 h-8 rounded-full border-2 border-white object-cover bg-slate-100" alt="Doctor" />
                                </div>
                                <span className="text-[12px] font-medium text-slate-500">1 Shared Access</span>
                            </div>
                        </div>
                        <button onClick={handleGrantAccess} className="w-full mt-6 py-2.5 font-bold text-[13px] text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-50 active:scale-95 transition-all">
                            Grant Access
                        </button>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100/80 group hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col justify-between min-h-[220px]">
                        <div>
                            <div className="flex justify-between items-start mb-5">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                    <ActivitySquare className="w-5 h-5" />
                                </div>
                                <span className="px-3 py-1 bg-blue-50 text-blue-400 text-[10px] font-extrabold tracking-wider rounded-md uppercase">CONFIDENTIAL</span>
                            </div>
                            <h3 className="text-[17px] font-bold text-slate-900 mb-1">Genetic Screening</h3>
                            <p className="text-[12px] font-medium text-slate-500 mb-5">Last updated Aug 15, 2023</p>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Lock className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-[12px] font-medium text-slate-500">No active shares</span>
                            </div>
                        </div>
                        <button onClick={handleGrantAccess} className="w-full mt-6 py-2.5 font-bold text-[13px] text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-50 active:scale-95 transition-all">
                            Grant Access
                        </button>
                    </div>
                </div>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border-2 border-[#b56b3e]/20 relative overflow-y-auto flex flex-col min-h-[400px] max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#fff5f0] text-[#b56b3e] rounded-full flex items-center justify-center shrink-0">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                            <h3 className="text-[17px] font-bold text-slate-900">Access Requests</h3>
                        </div>
                        
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center text-slate-400 font-medium animate-pulse">Loading...</div>
                        ) : requests.filter(r => r.status === 'Pending').length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                <ShieldCheck className="w-12 h-12 text-slate-200 mb-3" />
                                <div className="text-slate-500 font-bold text-[14px]">No pending requests</div>
                                <div className="text-slate-400 font-medium text-[13px] mt-1">Your privacy is secure</div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.filter(r => r.status === 'Pending').map(req => (
                                    <div key={req.id} className="p-5 bg-slate-50/80 border border-slate-100 rounded-2xl flex flex-col justify-between hover:border-[#b56b3e]/30 transition-all">
                                        <p className="text-[14px] font-medium text-slate-600 leading-relaxed mb-5">
                                            <strong className="text-slate-900">Dr. {req.doctor_details?.last_name || req.doctor_details?.first_name || 'Doctor'}</strong> is requesting access to your Full Medical Profile.
                                        </p>
                                        <div className="flex gap-3">
                                            <button onClick={async () => { await accessApi.approveRequest(req.id); fetchAccessData(); }} className="flex-1 py-3 bg-[#b56b3e] text-white font-bold text-[13px] rounded-xl hover:bg-[#965731] active:scale-95 transition-all outline-none">
                                                Approve
                                            </button>
                                            <button onClick={async () => { await accessApi.declineRequest(req.id); fetchAccessData(); }} className="flex-1 py-3 bg-white border border-slate-200 shadow-sm text-slate-700 font-bold text-[13px] rounded-xl hover:bg-slate-50 hover:text-red-600 active:scale-95 transition-all outline-none">
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Authorized Doctors List */}
                {activeTab === 'authorized-doctors' && (
                    <div className="bg-slate-50/50 rounded-[2rem] p-6 min-h-[400px] max-h-[600px] overflow-y-auto border border-slate-100 max-w-5xl mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1.5fr_2fr_1fr] items-center px-4 pb-4 border-b border-slate-200 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase bg-slate-50/80 sticky top-0 backdrop-blur-sm z-10">
                            <div>AUTHORIZED DOCTOR</div>
                            <div>RECORDS SHARED</div>
                            <div className="justify-self-end">ACTION</div>
                        </div>

                        {/* Rows */}
                        <div className="space-y-3 pt-4">
                            {loading ? (
                                <div className="text-center text-[13px] font-bold text-slate-400 mt-10 animate-pulse">Fetching authorizations...</div>
                            ) : grants.length === 0 ? (
                                <div className="text-center flex items-center justify-center flex-col mt-16">
                                    <Lock className="w-12 h-12 text-slate-200 mb-3" />
                                    <span className="text-[14px] font-bold text-slate-500">No authorized doctors</span>
                                </div>
                            ) : grants.map(grant => (
                                <div key={grant.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                                    <div className="grid grid-cols-[1.5fr_2fr_1fr] items-center w-full gap-4">
                                        <div className="flex items-center gap-3 pl-2">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center overflow-hidden shrink-0">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="text-[14px] font-bold text-slate-900 truncate">Dr. {grant.doctor_details?.last_name || grant.doctor_details?.first_name || 'Doctor'}</h4>
                                                <p className="text-[11px] font-bold text-slate-400 truncate">{grant.doctor_details?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold tracking-wide rounded-md">Full Access</span>
                                        </div>
                                        <div className="justify-self-end pr-2">
                                            <button onClick={async () => { await accessApi.revokeGrant(grant.id); fetchAccessData(); }} className="text-[12px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                                                Revoke
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bottom Banner Component */}
                <div className="mt-8 bg-blue-600 rounded-[2rem] p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-lg shadow-blue-600/20">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-[11px] font-extrabold tracking-wider text-blue-200">
                            <Globe className="w-4 h-4" /> NETWORK STATUS
                        </div>
                        <h3 className="text-[1.75rem] font-bold">Your Blockchain Node is Active</h3>
                        <p className="text-[14px] font-medium text-blue-100 max-w-xl">
                            Every permission change is cryptographically signed and stored on the immutable MedChain ledger for your protection.
                        </p>
                    </div>

                    <div className="mt-6 md:mt-0 flex items-center gap-8 bg-blue-500/30 rounded-3xl px-8 py-5 border border-blue-400/30 hover:bg-blue-500/40 transition-colors">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-extrabold text-blue-200 tracking-wider">TOTAL SHARED</span>
                            <span className="text-[2.25rem] leading-none font-black mt-1">14</span>
                        </div>
                        <div className="w-px h-12 bg-blue-400/50"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-extrabold text-blue-200 tracking-wider">REVOKED (30D)</span>
                            <span className="text-[2.25rem] leading-none font-black mt-1">2</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
