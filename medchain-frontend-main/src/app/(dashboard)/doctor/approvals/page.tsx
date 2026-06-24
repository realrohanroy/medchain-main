'use client';

import { useState, useEffect } from 'react';
import { appointmentsApi, Appointment } from '@/lib/api/appointments';
import { 
    Search, Share2, MoreVertical, Paperclip, CheckCircle2, 
    X, Loader2, CalendarDays, ClipboardList, Stethoscope, Mail
} from 'lucide-react';

export default function DoctorApprovalsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPendingAppointments = async () => {
        setIsLoading(true);
        try {
            const data = await appointmentsApi.getAppointments(1, 'Pending');
            const list = data.results || [];
            setAppointments(list);
            if (list.length > 0) {
                setSelectedRequest(list[0].id);
            } else {
                setSelectedRequest(null);
            }
        } catch (err) {
            console.error('Failed to fetch approvals', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingAppointments();
    }, []);

    const handleApprove = async (id: string) => {
        setIsProcessing(id);
        try {
            await appointmentsApi.confirmAppointment(id);
            await fetchPendingAppointments();
        } catch (err) {
            console.error('Failed to approve appointment', err);
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (id: string) => {
        setIsProcessing(id);
        try {
            await appointmentsApi.cancelAppointment(id);
            await fetchPendingAppointments();
        } catch (err) {
            console.error('Failed to reject appointment', err);
        } finally {
            setIsProcessing(null);
        }
    };

    // Filter appointments by search term
    const filteredApts = appointments.filter(apt => {
        const patientName = `${apt.patient_first_name || ''} ${apt.patient_last_name || ''}`.toLowerCase();
        const specialty = (apt.specialty || '').toLowerCase();
        const reason = (apt.reason || '').toLowerCase();
        const term = searchTerm.toLowerCase();
        return patientName.includes(term) || specialty.includes(term) || reason.includes(term);
    });

    const selectedApt = appointments.find(a => a.id === selectedRequest);

    return (
        <div className="min-h-full bg-[#F8FAFC] pb-16 flex justify-center">
            <div className="flex-1 max-w-[1300px] w-full p-8 animate-in fade-in duration-500">

                <div className="flex flex-col lg:flex-row gap-10">
                    
                    {/* Left Column: Approvals List */}
                    <div className="flex-1 lg:max-w-[450px] w-full">
                        <div className="mb-6">
                            <h2 className="text-[2.25rem] font-extrabold tracking-tight text-slate-900">
                                Approvals
                            </h2>
                            <p className="text-slate-500 font-medium mt-1 text-[15px]">
                                {appointments.length} Pending appointment request{appointments.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search by patient or specialty..."
                                className="w-full bg-white border border-slate-200 rounded-full pl-11 pr-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                            />
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-600" />
                                <p className="font-bold">Loading approvals...</p>
                            </div>
                        ) : filteredApts.length === 0 ? (
                            <div className="text-center text-slate-500 font-bold py-20 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                                <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                No pending requests found.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredApts.map(req => {
                                    const isSelected = selectedRequest === req.id;
                                    const hasReason = !!req.reason;
                                    const pName = req.patient_first_name || req.patient_last_name 
                                        ? `${req.patient_first_name || ''} ${req.patient_last_name || ''}`.trim()
                                        : req.patient_email || 'Anonymous Patient';
                                    
                                    return (
                                        <div 
                                            key={req.id}
                                            onClick={() => setSelectedRequest(req.id)}
                                            className={`p-5 rounded-[2rem] cursor-pointer transition-all border relative overflow-hidden ${
                                                isSelected 
                                                    ? 'bg-white border-blue-600 ring-1 ring-blue-600 shadow-md' 
                                                    : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300'
                                            }`}
                                        >
                                            {/* Priority Indicator Line */}
                                            {hasReason && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600"></div>}
                                            
                                            <div className="flex justify-between items-start mb-2 pl-2">
                                                <span className={`text-[10px] font-extrabold tracking-wider uppercase ${hasReason ? 'text-blue-600' : 'text-slate-400'}`}>
                                                    {hasReason ? 'URGENT REVIEW' : 'STANDARD'}
                                                </span>
                                                <span className="text-[11px] font-medium text-slate-400">
                                                    {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Today'}
                                                </span>
                                            </div>
                                            
                                            <div className="pl-2">
                                                <h4 className="font-extrabold text-[16px] text-slate-900">{pName}</h4>
                                                <p className="text-[13px] text-slate-500 mt-1 line-clamp-1">
                                                    {req.specialty || 'General Consultation'} • {req.appointment_time.slice(0, 5)}
                                                </p>
                                            </div>

                                            <div className="flex justify-between items-center mt-4 pl-2">
                                                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-600">
                                                    Pending
                                                </span>
                                                <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Request Details */}
                    <div className="flex-1 w-full">
                        {selectedApt ? (
                            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 relative">
                                
                                {/* Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="relative shrink-0">
                                            <div className="w-16 h-16 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl uppercase">
                                                {selectedApt.patient_first_name?.[0] || selectedApt.patient_email?.[0] || 'P'}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-[2rem] font-extrabold text-slate-900 leading-none">
                                                {selectedApt.patient_first_name || selectedApt.patient_last_name 
                                                    ? `${selectedApt.patient_first_name || ''} ${selectedApt.patient_last_name || ''}`.trim()
                                                    : 'Anonymous Patient'}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-4 mt-2">
                                                <span className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                                                    <CalendarIcon className="w-4 h-4" /> 
                                                    {new Date(selectedApt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {selectedApt.appointment_time.slice(0, 5)}
                                                </span>
                                                <span className="px-3 py-1 bg-orange-100 text-[#D14300] text-[10px] font-extrabold tracking-wider rounded-full uppercase">
                                                    Pending Approval
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                        <button className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Description Box */}
                                    <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col h-full">
                                        <h4 className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-4">Reason for Visit</h4>
                                        <p className="text-[17px] leading-relaxed text-slate-700 font-medium flex-1 italic">
                                            "{selectedApt.reason || 'No specific reasons provided by the patient. Standard clinic visit requested.'}"
                                        </p>
                                        
                                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center"><Stethoscope className="w-4 h-4 text-blue-600" /></div>
                                            <span className="text-sm font-semibold text-slate-600">
                                                Specialty Requested: {selectedApt.specialty || 'General Practice'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Patient Profile Sidebar */}
                                    <div className="space-y-6">
                                        <div className="bg-[#F8FAFC] rounded-3xl p-6 border border-slate-100 h-full flex flex-col justify-center">
                                            <h4 className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-5">Patient Profile</h4>
                                            
                                            <div className="space-y-5">
                                                <div>
                                                    <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">Email Address</p>
                                                    <p className="text-[13px] font-bold text-slate-900 truncate flex items-center gap-1.5">
                                                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedApt.patient_email || 'Not provided'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">Medchain Wallet</p>
                                                    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 mt-1">
                                                        <p className="text-[12px] font-mono text-slate-600 truncate">0x71C{selectedApt.id.slice(0, 4)}...4e8f</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">Primary Facility</p>
                                                    <p className="text-[13px] font-bold text-slate-900">St. Jude Medical Center</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Finalize Decision */}
                                <div className="mt-8 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        <div className="flex-1">
                                            <h3 className="text-[1.5rem] font-extrabold text-slate-900 mb-3">Finalize Decision</h3>
                                            <p className="text-[14px] text-slate-500 font-medium leading-relaxed mb-8">
                                                Confirming this request will reserve the date and time slots in your clinical calendar and automatically notify the patient.
                                            </p>
                                            <div className="flex gap-4">
                                                <button 
                                                    disabled={!!isProcessing}
                                                    onClick={() => handleApprove(selectedApt.id)}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-4 rounded-[1.25rem] font-bold text-[15px] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                                                >
                                                    {isProcessing === selectedApt.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <CheckCircle2 className="w-5 h-5" /> Confirm Appointment
                                                        </>
                                                    )}
                                                </button>
                                                <button 
                                                    disabled={!!isProcessing}
                                                    onClick={() => handleReject(selectedApt.id)}
                                                    className="flex-1 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 disabled:opacity-50 text-slate-700 py-4 rounded-[1.25rem] font-bold text-[15px] shadow-sm transition-all active:scale-95"
                                                >
                                                    {isProcessing === selectedApt.id ? (
                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        'Decline'
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 bg-[#F8FAFC] rounded-2xl p-5 border border-slate-100">
                                            <h4 className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase mb-3">Optional Note to Patient</h4>
                                            <textarea 
                                                placeholder="Provide any prep instructions or notes for the patient..."
                                                className="w-full h-24 bg-white border border-slate-200 rounded-xl p-3 text-[13px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-2 italic">Note: Custom messages will be shown in the patient's record panel.</p>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="bg-slate-50 rounded-[2.5rem] p-20 border border-slate-100 flex flex-col items-center justify-center text-center text-slate-500 h-full">
                                <CalendarDays className="w-16 h-16 text-slate-300 mb-4" />
                                <h3 className="text-xl font-bold text-slate-700">No Request Selected</h3>
                                <p className="text-slate-500 max-w-sm mt-2">Select a pending request from the left list to review medical details, patient credentials, and finalize approvals.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

const ChevronRightIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6"></polyline></svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
);
