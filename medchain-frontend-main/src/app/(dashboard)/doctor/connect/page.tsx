'use client';

import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { QrCode, RefreshCw, Copy, CheckCircle2, ShieldCheck } from 'lucide-react';
import apiClient from '@/lib/api/client';

export default function DoctorConnectPage() {
    const [qrData, setQrData] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [copied, setCopied] = useState(false);

    const fetchQR = async () => {
        try {
            const res = await apiClient.get('/auth/me/connection-qr/');
            setQrData(res.data.qr_data);
            setToken(res.data.token);
        } catch (err) {
            console.error('Failed to fetch QR', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQR();
    }, []);

    const regenerateQR = async () => {
        if (!confirm('Are you sure? This will invalidate your previous QR code. Patients who haven\'t connected yet will need the new one.')) return;
        
        setIsRegenerating(true);
        try {
            const res = await apiClient.post('/auth/me/connection-qr/regenerate/');
            setQrData(res.data.qr_data);
            setToken(res.data.token);
        } catch (err) {
            console.error('Failed to regenerate QR', err);
        } finally {
            setIsRegenerating(false);
        }
    };

    const copyToken = () => {
        if (token) {
            navigator.clipboard.writeText(token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-full bg-[#F8FAFC] pb-16 flex justify-center">
            <div className="flex-1 max-w-[800px] w-full p-8 animate-in fade-in duration-500">
                
                <div className="mb-8">
                    <h2 className="text-[2.25rem] font-extrabold tracking-tight text-slate-900">Connection QR</h2>
                    <p className="text-slate-500 font-medium mt-1 text-[15px] max-w-xl leading-relaxed">
                        Have your patients scan this QR code or enter the token below to establish a secure care relationship.
                    </p>
                </div>

                <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-12">
                    {/* QR Code Section */}
                    <div className="flex flex-col items-center gap-6">
                        <div className="bg-white p-6 rounded-[2rem] border-4 border-emerald-50 shadow-md">
                            {isLoading ? (
                                <div className="w-48 h-48 bg-slate-50 flex items-center justify-center rounded-xl">
                                    <QrCode className="w-12 h-12 text-slate-300 animate-pulse" />
                                </div>
                            ) : qrData ? (
                                <QRCode value={qrData} size={200} className="text-emerald-900" />
                            ) : (
                                <div className="w-48 h-48 bg-red-50 text-red-400 flex flex-col items-center justify-center rounded-xl font-bold text-center p-4 text-sm">
                                    Failed to load QR code.
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={regenerateQR}
                            disabled={isLoading || isRegenerating}
                            className="flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                            Regenerate Code
                        </button>
                    </div>

                    {/* Token Section */}
                    <div className="flex-1 space-y-8">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                                <h3 className="font-bold text-slate-900 text-lg">Manual Token Entry</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">
                                If the patient cannot scan the QR code, they can enter this secure token manually in their Access Control panel.
                            </p>
                            
                            <div className="flex items-center gap-3">
                                <code className="flex-1 block p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-700 break-all select-all">
                                    {isLoading ? 'Loading...' : token}
                                </code>
                                <button 
                                    onClick={copyToken}
                                    disabled={isLoading || !token}
                                    className="p-4 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors shrink-0 disabled:opacity-50"
                                    title="Copy to clipboard"
                                >
                                    {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                            <h4 className="font-bold text-blue-900 text-[13px] mb-2">How it works</h4>
                            <ol className="text-[12px] text-blue-800 space-y-2 list-decimal list-inside">
                                <li>The patient enters this token in their portal.</li>
                                <li>A secure Care Relationship is established.</li>
                                <li>You can now request access to their medical records or schedule appointments.</li>
                            </ol>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
