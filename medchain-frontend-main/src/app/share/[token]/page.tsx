'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    ShieldHalf, FileText, Activity, Clock, ShieldCheck, AlertCircle,
    Download, ArrowLeft, Loader2, CheckCircle2
} from 'lucide-react';
import { sharingApi } from '@/lib/api/sharing';
import type { RecordItem } from '@/lib/api/records';

function getStatusColor(status: string) {
    switch (status) {
        case 'CONFIRMED': return { bg: 'bg-emerald-50', text: 'text-emerald-600' };
        case 'PENDING': return { bg: 'bg-yellow-50', text: 'text-yellow-600' };
        default: return { bg: 'bg-slate-100', text: 'text-slate-500' };
    }
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'Radiology': return <Activity className="w-5 h-5" />;
        default: return <FileText className="w-5 h-5" />;
    }
}

function getTypeColors(type: string) {
    switch (type) {
        case 'Radiology': return 'bg-purple-50 text-purple-600';
        case 'Laboratory': return 'bg-orange-50 text-orange-600';
        default: return 'bg-blue-50 text-blue-600';
    }
}

export default function SharedRecordsPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const [records, setRecords] = useState<RecordItem[]>([]);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const data = await sharingApi.accessSharedRecords(token);
                setRecords(Array.isArray(data) ? data : []);
            } catch {
                setIsError(true);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecords();
    }, [token]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-4 animate-in fade-in duration-500">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                    <p className="text-[15px] font-bold text-slate-600">Verifying share token...</p>
                    <p className="text-[13px] font-medium text-slate-400">Checking blockchain for validity</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center space-y-6 max-w-md animate-in fade-in duration-500">
                    <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Invalid or Expired Token</h1>
                    <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
                        This share token is no longer valid. Tokens expire after 1 hour for security.
                        Please request a new share link from the record owner.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-md active:scale-95 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Minimal Branded Header */}
            <div className="bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-[900px] mx-auto px-8 py-5 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="bg-blue-600 rounded-xl p-2 text-white shadow-sm">
                            <ShieldHalf className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-extrabold tracking-tight text-blue-600">MedChain</span>
                    </Link>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-full text-[12px] border border-emerald-100">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Secure Shared View
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[900px] mx-auto px-8 py-10 space-y-8 animate-in fade-in duration-500">

                {/* Info Banner */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-[2rem] p-6 flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-[15px] font-bold text-slate-900 mb-1">Shared Medical Records</h3>
                        <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                            These records were shared securely via token <span className="font-mono text-[12px] bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">{token.slice(0, 12)}...</span>.
                            All access is logged on the MedChain blockchain.
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-[12px] font-bold text-slate-400">
                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Expires in ~1 hour</span>
                            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Token verified</span>
                        </div>
                    </div>
                </div>

                {/* Records List */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-900">{records.length} Records Shared</h2>

                    {records.map((record: RecordItem) => {
                        const statusColors = getStatusColor(record.blockchain_status);
                        return (
                            <div
                                key={record.id}
                                className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100/80 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:-translate-y-0.5 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-4 flex-1">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getTypeColors(record.record_type)}`}>
                                        {getTypeIcon(record.record_type)}
                                    </div>
                                    <div>
                                        <h4 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                            {record.file_url ? record.file_url.split('/').pop() : record.record_type}
                                        </h4>
                                        <p className="text-[13px] font-medium text-slate-500 mt-0.5">
                                            {record.record_type} • {record.doctor_name} • {record.record_date}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 shrink-0">
                                    <span className={`px-3 py-1.5 ${statusColors.bg} ${statusColors.text} text-[10px] font-extrabold tracking-wider rounded-full`}>
                                        {record.blockchain_status}
                                    </span>
                                    <button className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2.5 rounded-full active:scale-95 transition-all">
                                        <Download className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Note */}
                <div className="text-center pt-4 pb-8">
                    <p className="text-[12px] font-medium text-slate-400">
                        This page is read-only. Contact the patient directly if additional records are needed.
                    </p>
                </div>
            </div>
        </div>
    );
}
