'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
    Activity, Calendar, FileText, Pill, Download, Filter, Plus, Droplet, Stethoscope, ChevronRight, AlertCircle, Loader2
} from 'lucide-react';
import { recordsApi, RecordItem } from '@/lib/api/records';
import Link from 'next/link';

function RecordsContent() {
    const searchParams = useSearchParams();
    const patientId = searchParams.get('patientId');
    const patientName = searchParams.get('patientName') || 'Unknown Patient';

    const [records, setRecords] = useState<RecordItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecords = async () => {
            if (!patientId) {
                setIsLoading(false);
                return;
            }
            try {
                const res = await recordsApi.getPatientRecordsByDoctor(patientId);
                setRecords(res.results || []);
            } catch (e: any) {
                console.error(e);
                setError(e.response?.data?.error || 'Failed to fetch patient records.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecords();
    }, [patientId]);

    if (!patientId) {
        return (
            <div className="min-h-full bg-[#F8FAFC] pb-16 flex items-center justify-center">
                <div className="text-center p-8">
                    <AlertCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">No Patient Selected</h2>
                    <p className="text-slate-500 mb-6">Please navigate to the Patients directory and select a patient to view their medical history.</p>
                    <Link href="/doctor/patients" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full font-bold shadow-sm transition-colors">
                        Go to Patient Directory
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#F8FAFC] pb-16 flex justify-center">
            <div className="flex-1 max-w-[1300px] w-full p-8 animate-in fade-in duration-500">
                <div className="flex flex-col lg:flex-row gap-10 mt-4">
                    {/* Left Column: Timeline */}
                    <div className="flex-1 max-w-[800px]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-[2.25rem] font-extrabold tracking-tight text-slate-900 leading-none">
                                        {patientName}
                                    </h1>
                                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[12px] font-bold tracking-wider">
                                        #ID-{patientId.slice(0, 6)}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Link href="/doctor/patients" className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2.5 rounded-full font-bold text-[14px] transition-colors">
                                    Back to Directory
                                </Link>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Medical History Timeline</h2>
                        </div>

                        {isLoading ? (
                            <div className="flex items-center gap-3 text-emerald-600">
                                <Loader2 className="w-5 h-5 animate-spin" /> Fetching secure records...
                            </div>
                        ) : error ? (
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 font-medium">
                                {error}
                            </div>
                        ) : records.length === 0 ? (
                            <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                                <p className="text-slate-500 font-medium">No medical records found for this patient.</p>
                            </div>
                        ) : (
                            <div className="relative pl-4 border-l-2 border-slate-200 space-y-8 ml-3 pb-8">
                                {records.map((record, index) => (
                                    <div key={record.id} className="relative pl-8 group">
                                        <div className="absolute -left-[27px] top-4 w-[18px] h-[18px] rounded-full bg-white border-4 border-emerald-500 shadow-sm z-10 group-hover:scale-125 transition-transform"></div>
                                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[17px] font-bold text-slate-900">{record.record_type || 'Uncategorized Record'}</h3>
                                                        <p className="text-[13px] text-slate-500 font-medium mt-0.5">By {record.doctor_name || 'Unknown Provider'}</p>
                                                    </div>
                                                </div>
                                                {record.blockchain_status === 'VERIFIED' ? (
                                                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap border border-emerald-100">
                                                        Verified on Polygon
                                                    </span>
                                                ) : (
                                                    <span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap border border-orange-100">
                                                        Pending Verification
                                                    </span>
                                                )}
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100">
                                                <div className="flex gap-8">
                                                    <div>
                                                        <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">Date</p>
                                                        <p className="font-extrabold text-slate-900 mt-0.5">{record.record_date || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                {record.file_url && (
                                                    <a href={record.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[13px] font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
                                                        View Document <Download className="w-4 h-4 ml-1" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MedicalRecordsTimeline() {
    return (
        <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600" /></div>}>
            <RecordsContent />
        </Suspense>
    );
}
