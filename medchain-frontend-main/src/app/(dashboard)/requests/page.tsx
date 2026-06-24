'use client';

import { useState, useEffect } from 'react';
import {
    ClipboardList, CheckCircle2, Ban, Clock, TrendingUp, Filter, Plus,
    X, FileText, FileClock, ChevronLeft, ChevronRight, Check, CalendarDays,
    Stethoscope, Loader2
} from "lucide-react"
import { accessApi, AccessRequestModel } from '@/lib/api/access';
import { appointmentsApi, Appointment } from '@/lib/api/appointments';

type RequestType = 'all' | 'appointments' | 'access';

export default function RequestsPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [requestType, setRequestType] = useState<RequestType>('all');

    // Access requests
    const [accessRequests, setAccessRequests] = useState<AccessRequestModel[]>([]);
    // Appointment requests (Pending ones)
    const [appointmentRequests, setAppointmentRequests] = useState<Appointment[]>([]);
    
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchAllData = async () => {
        try {
            setIsLoading(true);
            setFetchError(null);

            // Fetch independently so one failing doesn't block the other
            let accessData: AccessRequestModel[] = [];
            let aptResults: Appointment[] = [];

            try {
                accessData = await accessApi.getRequests();
            } catch (e) {
                console.error('Failed to fetch access requests:', e);
            }

            try {
                const aptData = await appointmentsApi.getAppointments(1);
                aptResults = aptData.results || [];
            } catch (e) {
                console.error('Failed to fetch appointments:', e);
            }

            setAccessRequests(accessData);
            setAppointmentRequests(aptResults.filter(a => a.status === 'Pending'));
        } catch (err: any) {
            console.error(err);
            setFetchError(`Failed to fetch requests: ${err.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    // Stats
    const pendingAccessCount = accessRequests.filter(r => r.status === 'Pending').length;
    const pendingAptCount = appointmentRequests.length;
    const totalPending = pendingAccessCount + pendingAptCount;
    const approvedCount = accessRequests.filter(r => r.status === 'Approved').length;
    const rejectedCount = accessRequests.filter(r => r.status === 'Declined').length;

    // Filter access requests by tab
    const displayAccessRequests = accessRequests.filter(r => {
        if (activeTab === 'all') return true;
        if (activeTab === 'pending') return r.status === 'Pending';
        if (activeTab === 'approved') return r.status === 'Approved';
        if (activeTab === 'rejected') return r.status === 'Declined';
        return true;
    });

    const handleConfirmAppointment = async (id: string) => {
        setProcessingId(id);
        try {
            await appointmentsApi.confirmAppointment(id);
            await fetchAllData();
        } catch (err) {
            console.error('Failed to confirm', err);
        } finally {
            setProcessingId(null);
        }
    };

    const handleCancelAppointment = async (id: string) => {
        setProcessingId(id);
        try {
            await appointmentsApi.cancelAppointment(id);
            await fetchAllData();
        } catch (err) {
            console.error('Failed to cancel', err);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-full bg-slate-50/50 pb-20 relative">
            <div className="flex-1 p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500 mt-2 space-y-8">

                {fetchError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
                      <strong className="font-bold">Error: </strong>
                      <span className="block sm:inline">{fetchError}</span>
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Pending Stat */}
                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>
                        <div className="pl-3">
                            <h3 className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase mb-1">PENDING</h3>
                            <div className="text-[2.5rem] font-bold text-slate-900 leading-none mb-2">{totalPending.toString().padStart(2, '0')}</div>
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600">
                                <Clock className="w-3.5 h-3.5" /> {pendingAptCount} appointments • {pendingAccessCount} access
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <ClipboardList className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Approved Stat */}
                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00A86B]"></div>
                        <div className="pl-3">
                            <h3 className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase mb-1">APPROVED</h3>
                            <div className="text-[2.5rem] font-bold text-slate-900 leading-none mb-2">{approvedCount}</div>
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#00A86B]">
                                <TrendingUp className="w-3.5 h-3.5" /> Access grants
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-[#e6f6f0] text-[#00A86B] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>

                    {/* Rejected Stat */}
                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 flex items-center justify-between relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#d32f2f]"></div>
                        <div className="pl-3">
                            <h3 className="text-[11px] font-extrabold text-slate-500 tracking-wider uppercase mb-1">REJECTED</h3>
                            <div className="text-[2.5rem] font-bold text-slate-900 leading-none mb-2">{rejectedCount}</div>
                            <div className="flex items-center gap-1.5 text-[12px] font-bold text-[#d32f2f]">
                                <Ban className="w-3.5 h-3.5" /> Restricted
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-[#fdeaea] text-[#d32f2f] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Ban className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Type Selector */}
                <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-full border border-slate-200/50 w-fit">
                    {[
                        { label: 'All', value: 'all' as RequestType },
                        { label: 'Appointments', value: 'appointments' as RequestType },
                        { label: 'Access Requests', value: 'access' as RequestType },
                    ].map(item => (
                        <button
                            key={item.value}
                            onClick={() => setRequestType(item.value)}
                            className={`px-5 py-2 font-bold text-[13px] rounded-full transition-all active:scale-95 ${
                                requestType === item.value
                                    ? 'bg-white text-blue-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                        <p className="font-bold">Loading requests...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* APPOINTMENT REQUESTS SECTION */}
                        {(requestType === 'all' || requestType === 'appointments') && appointmentRequests.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-[13px] font-extrabold text-slate-400 tracking-wider uppercase">
                                    Pending Appointment Requests ({appointmentRequests.length})
                                </h3>
                                {appointmentRequests.map(apt => {
                                    const isProcessing = processingId === apt.id;
                                    const aptDate = new Date(apt.appointment_date);
                                    const [hour, minute] = apt.appointment_time.split(':');
                                    const h = parseInt(hour, 10);
                                    const ampm = h >= 12 ? 'PM' : 'AM';
                                    const formattedHour = h % 12 || 12;

                                    return (
                                        <div key={apt.id} className="p-5 rounded-[1.5rem] flex flex-col md:flex-row md:items-center justify-between shadow-sm border border-slate-100 hover:shadow-md transition-shadow bg-white">
                                            <div className="flex items-center gap-4 mb-4 md:mb-0 w-full md:w-[40%]">
                                                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                                    <CalendarDays className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="text-[15px] font-bold text-slate-900">
                                                        {apt.specialty || 'General Consultation'}
                                                    </h4>
                                                    <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 mt-0.5">
                                                        <Stethoscope className="w-3.5 h-3.5" /> {apt.doctor_name}
                                                    </div>
                                                    {apt.reason && (
                                                        <p className="text-[11px] text-slate-400 mt-0.5 italic truncate max-w-[200px]">"{apt.reason}"</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center justify-between w-full md:w-[60%] gap-4 md:gap-8">
                                                <div className="w-[25%]">
                                                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-1">DATE & TIME</span>
                                                    <span className="text-[13px] font-bold text-slate-800">
                                                        {aptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </span>
                                                    <span className="text-[12px] font-medium text-slate-500 ml-2">
                                                        {formattedHour}:{minute} {ampm}
                                                    </span>
                                                </div>
                                                <div className="w-[15%]">
                                                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-1">STATUS</span>
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-[11px] font-bold leading-none">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5"></div> Pending
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-end gap-3 w-[35%]">
                                                    <button
                                                        onClick={() => handleConfirmAppointment(apt.id)}
                                                        disabled={isProcessing}
                                                        className="px-6 py-2.5 bg-blue-600 text-white font-bold text-[13px] rounded-full hover:bg-blue-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                                                    >
                                                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ Confirm'}
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelAppointment(apt.id)}
                                                        disabled={isProcessing}
                                                        className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full active:scale-95 transition-all disabled:opacity-50"
                                                    >
                                                        <X className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ACCESS REQUESTS SECTION */}
                        {(requestType === 'all' || requestType === 'access') && (
                            <div className="space-y-4">
                                {(requestType === 'all' || requestType === 'access') && (
                                    <>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 mt-4">
                                            <div className="flex items-center gap-8">
                                                {['All Requests', 'Pending', 'Approved', 'Rejected'].map(tab => {
                                                    const value = tab.toLowerCase().replace(' ', '-');
                                                    return (
                                                        <button
                                                            key={tab}
                                                            onClick={() => setActiveTab(value)}
                                                            className={`pb-4 px-1 text-[15px] font-bold transition-all border-b-[3px] ${activeTab === value
                                                                    ? 'border-blue-600 text-blue-600'
                                                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                                                                }`}
                                                        >
                                                            {tab}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <h3 className="text-[13px] font-extrabold text-slate-400 tracking-wider uppercase mt-4">
                                            Access Requests ({displayAccessRequests.length})
                                        </h3>
                                    </>
                                )}

                                {displayAccessRequests.length === 0 ? (
                                    <div className="text-center text-slate-500 font-bold py-10">No access requests found.</div>
                                ) : displayAccessRequests.map(req => {
                                    const isPending = req.status === 'Pending';
                                    const isApproved = req.status === 'Approved';
                                    const isDeclined = req.status === 'Declined';
                                    return (
                                        <div key={req.id} className={`p-5 rounded-[1.5rem] flex flex-col md:flex-row md:items-center justify-between shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-default ${isApproved ? 'bg-white/60 hover:bg-white' : 'bg-white'}`}>
                                            <div className={`flex items-center gap-4 mb-4 md:mb-0 w-full md:w-[35%] ${isApproved ? 'opacity-80 group-hover:opacity-100 transition-opacity' : ''}`}>
                                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center text-slate-400">
                                                   <FileText className="w-5 h-5"/>
                                                </div>
                                                <div>
                                                    <h4 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Dr. {req.doctor_details?.last_name || req.doctor_details?.first_name || 'Anonymous'}</h4>
                                                    <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-slate-500 mt-0.5">
                                                        {isPending ? <FileClock className="w-3.5 h-3.5" /> : isApproved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />} {req.reason || 'Medical permissions request'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row md:items-center justify-between w-full md:w-[65%] gap-4 md:gap-8">
                                                <div className="w-[20%]">
                                                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-1">STATUS</span>
                                                    {isPending && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#cc5500] text-white text-[11px] font-bold leading-none">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 mr-1.5"></div> Urgent
                                                        </span>
                                                    )}
                                                    {isApproved && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#e6f6f0] text-[#00A86B] text-[11px] font-bold leading-none">
                                                            Approved
                                                        </span>
                                                    )}
                                                    {isDeclined && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#fdeaea] text-[#d32f2f] text-[11px] font-bold leading-none">
                                                            Declined
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="w-[30%]">
                                                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase block mb-1">REQUESTED</span>
                                                    <span className="text-[13px] font-bold text-slate-800">{new Date(req.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center justify-end gap-3 w-[40%]">
                                                    {isPending ? (
                                                        <>
                                                            <button onClick={async () => { await accessApi.approveRequest(req.id); fetchAllData(); }} className="px-6 py-2.5 bg-blue-600 text-white font-bold text-[13px] rounded-full hover:bg-blue-700 active:scale-95 transition-all shadow-sm">
                                                                Approve
                                                            </button>
                                                            <button onClick={async () => { await accessApi.declineRequest(req.id); fetchAllData(); }} className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full active:scale-95 transition-all">
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button className="px-6 py-2.5 bg-slate-100 text-slate-500 font-bold text-[13px] rounded-full hover:bg-slate-200 active:scale-95 transition-all outline-none">
                                                            View Snapshot
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Empty state when filtering */}
                        {requestType === 'appointments' && appointmentRequests.length === 0 && (
                            <div className="bg-white rounded-[2rem] border border-slate-100 py-20 flex flex-col items-center text-center">
                                <CalendarDays className="w-12 h-12 text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-700">No Pending Appointments</h3>
                                <p className="text-slate-500 max-w-sm mt-2">All your appointment requests have been processed. Book a new one from the Appointments tab.</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}
