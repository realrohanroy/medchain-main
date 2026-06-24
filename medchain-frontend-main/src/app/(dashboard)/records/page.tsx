'use client';

import { useState, useEffect } from 'react';
import {
    Search, CalendarDays, Users, LayoutGrid, List, UploadCloud,
    Share2, Download, MoreVertical, X, Plus, FileText,
    Microscope, HeartPulse, HardDriveUpload, Camera, Image as ImageIcon,
    CheckCircle2, Copy, Check, Clock, ShieldCheck, Link2, Loader2
} from "lucide-react"
import { sharingApi, type GenerateShareResponse } from '@/lib/api/sharing';

// Share Modal Component
function ShareModal({ recordName, recordId, onClose }: { recordName: string; recordId?: string; onClose: () => void }) {
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [shareData, setShareData] = useState<GenerateShareResponse | null>(null);

    useEffect(() => {
        const fetchShareToken = async () => {
            try {
                const data = await sharingApi.generateToken(recordId);
                // Rewrite share_url to point to frontend route instead of backend
                data.share_url = `${window.location.origin}/share/${data.token}`;
                setShareData(data);
            } catch {
                setError('Failed to generate share link. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchShareToken();
    }, [recordId]);

    const displayUrl = shareData?.share_url || '';

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(displayUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback
            const textArea = document.createElement('textarea');
            textArea.value = displayUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 space-y-6 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                            <Share2 className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-[17px] font-bold text-slate-900">Share Record</h3>
                            <p className="text-[13px] font-medium text-slate-500 mt-0.5">{recordName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full active:scale-95 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <p className="text-[13px] font-bold text-slate-500">Generating secure share link...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                            <X className="w-6 h-6" />
                        </div>
                        <p className="text-[13px] font-bold text-red-600">{error}</p>
                        <p className="text-[12px] text-slate-400">Make sure the backend server is running.</p>
                    </div>
                ) : (
                    <>
                        {/* Share URL */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase">SHARE LINK</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 overflow-hidden">
                                    <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span className="text-[13px] font-mono font-medium text-slate-600 truncate">
                                        {displayUrl}
                                    </span>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className={`px-5 py-3.5 font-bold text-[13px] rounded-xl active:scale-95 transition-all flex items-center gap-2 shrink-0 ${copied
                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                                        }`}
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Token Details */}
                        <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
                                    <Clock className="w-3.5 h-3.5" /> Expires
                                </div>
                                <span className="text-[12px] font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                                    In 1 hour
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[12px] font-bold text-slate-500">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Security
                                </div>
                                <span className="text-[12px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                    Blockchain Logged
                                </span>
                            </div>
                        </div>

                        {/* Footer Note */}
                        <p className="text-[12px] font-medium text-slate-400 text-center leading-relaxed">
                            Anyone with this link can view this record until the token expires.
                            Share only with trusted healthcare providers.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
export default function RecordsPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [shareModal, setShareModal] = useState<{ isOpen: boolean; recordName: string; recordId?: string }>({ isOpen: false, recordName: '' });

    // Live data state
    const [records, setRecords] = useState<import('@/lib/api/records').RecordItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [apiError, setApiError] = useState<string | null>(null);

    // Upload form state
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [recordType, setRecordType] = useState('General Health');
    const [doctorName, setDoctorName] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            setApiError(null);
            const { recordsApi } = await import('@/lib/api/records');
            const data = await recordsApi.getTimeline();
            setRecords(data.results);
        } catch {
            setApiError('Could not load records. Make sure you are logged in and backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile) return;
        setUploadLoading(true);
        setUploadError(null);
        setUploadSuccess(false);
        try {
            const { recordsApi } = await import('@/lib/api/records');
            await recordsApi.upload(uploadFile, recordType, doctorName);
            setUploadSuccess(true);
            setUploadFile(null);
            setDoctorName('');
            await fetchRecords(); // refresh list
            setTimeout(() => { setIsUploadOpen(false); setUploadSuccess(false); }, 1500);
        } catch {
            setUploadError('Upload failed. Make sure the backend is running and you are logged in.');
        } finally {
            setUploadLoading(false);
        }
    };

    const getTypeColors = (type: string) => {
        switch (type) {
            case 'Radiology': return { bg: 'bg-purple-50', text: 'text-purple-600', icon: <ImageIcon className="w-6 h-6" /> };
            case 'Cardiology': return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <HeartPulse className="w-6 h-6" /> };
            case 'Laboratory': return { bg: 'bg-orange-50', text: 'text-orange-600', icon: <Microscope className="w-6 h-6" /> };
            default: return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <FileText className="w-6 h-6" /> };
        }
    };

    return (
        <div className="min-h-full bg-slate-50/50 pb-20 relative">
            <div className={`flex gap-8 p-8 max-w-[1400px] mx-auto animate-in fade-in duration-500 mt-2`}>

                {/* Main Content Area */}
                <div className="flex-1 space-y-8 transition-all duration-500">

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="text-[13px] font-bold text-slate-400 mb-2 tracking-wide flex items-center gap-2">
                                Patient <span className="text-slate-300">â€º</span> <span className="text-blue-600 hover:underline cursor-pointer">Records</span>
                            </div>
                            <h2 className="text-[2.25rem] font-bold tracking-tight text-slate-900 leading-tight">
                                My Medical Records
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                                <button onClick={() => setViewMode('grid')} className={`p-2 active:scale-95 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
                                    <LayoutGrid className="w-5 h-5" />
                                </button>
                                <button onClick={() => setViewMode('list')} className={`p-2 active:scale-95 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                            <button
                                onClick={() => setIsUploadOpen(!isUploadOpen)}
                                className={`flex items-center gap-2 px-6 py-3 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all ${isUploadOpen ? 'bg-blue-800 ring-2 ring-blue-300 ring-offset-2' : 'bg-blue-600'}`}
                            >
                                <UploadCloud className="w-5 h-5" />
                                Upload Record
                            </button>
                        </div>
                    </div>

                    {/* Error Banner */}
                    {apiError && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-[13px] font-medium text-red-600 flex items-center gap-3">
                            <X className="w-4 h-4 shrink-0" /> {apiError}
                        </div>
                    )}

                    {/* Records Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                <p className="text-[14px] font-bold text-slate-500">Loading your records...</p>
                            </div>
                        </div>
                    ) : records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                            <div className="w-20 h-20 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center">
                                <FileText className="w-9 h-9" />
                            </div>
                            <h3 className="text-[18px] font-bold text-slate-800">No records yet</h3>
                            <p className="text-[14px] font-medium text-slate-500 max-w-xs">Upload your first medical record using the button above to get started.</p>
                        </div>
                    ) : (
                        <div className={`grid gap-6 ${viewMode === 'list' ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-2'}`}>
                            {records.map((record) => {
                                const typeStyle = getTypeColors(record.record_type);
                                const fileName = record.file_url ? record.file_url.split('/').pop() : record.record_type;
                                return (
                                    <div key={record.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100/80 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-lg transition-all">
                                        <div>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className={`w-12 h-12 ${typeStyle.bg} ${typeStyle.text} rounded-full flex items-center justify-center`}>
                                                    {typeStyle.icon}
                                                </div>
                                                <span className={`px-3 py-1 text-[10px] font-extrabold tracking-wider rounded-full ${record.blockchain_status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                                    {record.blockchain_status}
                                                </span>
                                            </div>
                                            <h3 className="text-[17px] font-bold text-slate-900 mb-2 line-clamp-1 hover:text-blue-600 transition-colors cursor-pointer">{fileName}</h3>
                                            <div className="flex items-center gap-2 mb-6">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-extrabold tracking-wider rounded-md">{record.record_type.toUpperCase()}</span>
                                                <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-md">{record.doctor_name}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 text-[13px] font-medium text-slate-400">
                                                <CalendarDays className="w-4 h-4" /> {record.record_date}
                                            </div>
                                            <div className="h-px bg-slate-100 w-full" />
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    {record.file_url && (
                                                        <a href={record.file_url} target="_blank" rel="noopener noreferrer" className="text-[14px] font-bold text-blue-600 hover:text-blue-700 active:scale-95 transition-all">View</a>
                                                    )}
                                                    <button onClick={() => setShareModal({ isOpen: true, recordName: fileName || record.record_type, recordId: record.id })} className="text-[14px] font-bold text-slate-600 hover:text-slate-900 active:scale-95 transition-all">Share</button>
                                                </div>
                                                {record.file_url && (
                                                    <a href={record.file_url} download className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full active:scale-95 transition-all">
                                                        <Download className="w-5 h-5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Upload Sidebar */}
                {isUploadOpen && (
                    <div className="w-[400px] bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-8 flex flex-col sticky top-28 h-[calc(100vh-140px)] shrink-0 animate-in slide-in-from-right-8 duration-300">
                        <div className="flex items-center justify-between mb-8 shrink-0">
                            <h3 className="text-[1.25rem] font-bold text-slate-900">Upload Record</h3>
                            <button onClick={() => setIsUploadOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full active:scale-95 transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpload} className="flex flex-col gap-5 flex-1 overflow-y-auto">
                            {/* File Drop Zone */}
                            <label className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-blue-50 transition-all">
                                <div className="w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center text-blue-600 mb-4">
                                    <HardDriveUpload className="w-6 h-6" />
                                </div>
                                {uploadFile ? (
                                    <>
                                        <h4 className="text-[14px] font-bold text-slate-900 mb-1 line-clamp-1">{uploadFile.name}</h4>
                                        <p className="text-[12px] font-medium text-slate-500">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB â€” click to change</p>
                                    </>
                                ) : (
                                    <>
                                        <h4 className="text-[15px] font-bold text-slate-900 mb-1">Drop file here</h4>
                                        <p className="text-[13px] font-medium text-slate-500">PDF, JPG, PNG supported</p>
                                    </>
                                )}
                                <input type="file" accept=".pdf,image/jpeg,image/png" className="hidden" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                            </label>

                            {/* Record Type */}
                            <div>
                                <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase mb-2 block">Record Type</label>
                                <select value={recordType} onChange={(e) => setRecordType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                                    <option>General Health</option>
                                    <option>Radiology</option>
                                    <option>Laboratory</option>
                                    <option>Cardiology</option>
                                    <option>Prescription</option>
                                    <option>Surgery</option>
                                </select>
                            </div>

                            {/* Doctor Name */}
                            <div>
                                <label className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase mb-2 block">Doctor / Provider Name</label>
                                <input
                                    type="text"
                                    value={doctorName}
                                    onChange={(e) => setDoctorName(e.target.value)}
                                    placeholder="e.g. Dr. Smith"
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                            </div>

                            {uploadError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-[13px] font-medium text-red-600">
                                    <X className="w-4 h-4 shrink-0" /> {uploadError}
                                </div>
                            )}
                            {uploadSuccess && (
                                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[13px] font-medium text-emerald-600">
                                    <CheckCircle2 className="w-4 h-4 shrink-0" /> Upload successful!
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={!uploadFile || uploadLoading}
                                className={`w-full py-4 font-bold rounded-2xl text-[15px] transition-all flex items-center justify-center gap-2 ${uploadFile && !uploadLoading ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                            >
                                {uploadLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Uploading...</> : 'Upload to MedChain'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Floating Action Button */}
            {!isUploadOpen && (
                <button onClick={() => setIsUploadOpen(true)} className="fixed bottom-10 right-10 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-50 animate-in zoom-in duration-300">
                    <div className="relative">
                        <Camera className="w-7 h-7" />
                        <div className="absolute -top-1 -right-1.5 bg-white text-blue-600 w-4 h-4 rounded-full flex items-center justify-center">
                            <Plus className="w-3 h-3 font-bold" />
                        </div>
                    </div>
                </button>
            )}

            {/* Share Modal */}
            {shareModal.isOpen && (
                <ShareModal
                    recordName={shareModal.recordName}
                    recordId={shareModal.recordId}
                    onClose={() => setShareModal({ isOpen: false, recordName: '' })}
                />
            )}
        </div>
    )
}
