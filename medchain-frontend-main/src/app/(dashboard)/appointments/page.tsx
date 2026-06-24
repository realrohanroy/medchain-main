'use client';

import { useState, useEffect } from 'react';
import {
    Plus, List, Calendar as CalendarIcon,
    MoreVertical, Info, FileText, ChevronDown, CheckCircle2, Clock,
    MapPin, User, Stethoscope, Loader2
} from "lucide-react"
import { appointmentsApi, Appointment } from '@/lib/api/appointments';
import { authApi } from '@/lib/api/auth';

export default function AppointmentsPage() {
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    
    // API State
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [apiError, setApiError] = useState('');

    // Booking Form State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [doctorName, setDoctorName] = useState('Dr. Harpreet Singh');
    const [specialty, setSpecialty] = useState('Cardiologist');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [reason, setReason] = useState('');
    const [doctorsList, setDoctorsList] = useState<Array<{ id: string; email: string; name: string; specialty: string }>>([]);

    const fetchAppointments = async () => {
        try {
            setIsLoading(true);
            setApiError('');
            // Only fetch Confirmed appointments for the list/calendar view
            const data = await appointmentsApi.getAppointments(1, 'Confirmed');
            setAppointments(data.results);
        } catch (err) {
            setApiError('Failed to load appointments.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDoctors = async () => {
        try {
            const docs = await authApi.getDoctors();
            setDoctorsList(docs);
            if (docs.length > 0) {
                setDoctorName(docs[0].name);
                setSpecialty(docs[0].specialty);
            }
        } catch (err) {
            console.error('Failed to fetch doctors', err);
        }
    };

    useEffect(() => {
        fetchAppointments();
        fetchDoctors();
        
        // Default date/time
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDate(tomorrow.toISOString().split('T')[0]);
        setTime('09:00');
    }, []);

    const handleQuickBook = async () => {
        if (!date || !time) {
            setApiError('Please select both date and time.');
            return;
        }
        setIsSubmitting(true);
        setApiError('');
        try {
            await appointmentsApi.bookAppointment({
                doctor_name: doctorName,
                specialty: specialty,
                appointment_date: date,
                appointment_time: time + ':00', // Ensure HH:MM:SS format for Django
                reason: reason
            });
            setIsSubmitted(true);
            setReason('');
            // Don't refresh appointments here since new booking is Pending, 
            // it won't show until confirmed via Requests page
            setTimeout(() => setIsSubmitted(false), 3000);
        } catch (err) {
            console.error('Failed to book', err);
            setApiError('Failed to submit appointment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch(status.toLowerCase()) {
            case 'confirmed': return { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-600', tag: 'Confirmed' };
            case 'pending': return { bg: 'bg-orange-50', text: 'text-orange-700', iconBg: 'bg-orange-600', tag: 'Awaiting Confirmation' };
            case 'cancelled': return { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-600', tag: 'Cancelled' };
            default: return { bg: 'bg-slate-100', text: 'text-slate-500', iconBg: 'bg-slate-400', tag: 'Completed' };
        }
    };

    const renderCalendar = () => {
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();

        const cells = [];
        for (let i = 0; i < firstDay; i++) {
            cells.push(<div key={`empty-${i}`} className="min-h-[100px] border border-slate-100 bg-slate-50/50 p-2 rounded-xl"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const dayAppointments = appointments.filter(apt => {
                const aptDate = new Date(apt.appointment_date);
                return aptDate.getDate() === day && aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
            });

            cells.push(
                <div key={`day-${day}`} className={`min-h-[100px] border border-slate-100 bg-white p-2 flex flex-col gap-1 rounded-xl transition-all ${dayAppointments.length > 0 ? 'ring-2 ring-blue-500/20 shadow-sm' : 'hover:bg-slate-50'}`}>
                    <span className={`text-[12px] font-bold self-end mb-1 ${day === new Date().getDate() ? 'bg-blue-600 w-6 h-6 flex items-center justify-center rounded-full text-white shadow-sm' : 'text-slate-400'}`}>{day}</span>
                    {dayAppointments.map((apt) => {
                       const c = getStatusColor(apt.status);
                       return <div key={apt.id} className={`text-[9.5px] font-bold px-1.5 py-1 rounded-[0.4rem] truncate ${c.bg} ${c.text}`}>{apt.appointment_time.slice(0, 5)} - {apt.doctor_name.split(' ').pop()}</div>
                    })}
                </div>
            );
        }
        
        return (
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="flex items-center justify-between mb-6 px-2">
                   <h3 className="text-[1.35rem] font-bold text-slate-900 tracking-tight capitalize">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
               </div>
               <div className="grid grid-cols-7 gap-3 mb-3 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                   {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
               </div>
               <div className="grid grid-cols-7 gap-3">
                   {cells}
               </div>
            </div>
        );
    };

    return (
        <div className="min-h-full bg-slate-50/50 pb-20">
            <div className="flex-1 p-8 max-w-[1200px] mx-auto animate-in fade-in duration-500 mt-2 space-y-10">

                {/* Header Section */}
                <div className="space-y-6">
                    <h1 className="text-xl font-bold text-blue-600 tracking-tight">Appointments</h1>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="max-w-2xl">
                            <h2 className="text-[2.75rem] font-bold tracking-tight text-slate-900 leading-[1.15]">
                                Manage your clinical <br />
                                <span className="text-blue-600">care journey.</span>
                            </h2>
                            <p className="text-[15px] font-medium text-slate-500 mt-4 leading-relaxed max-w-xl">
                                View upcoming visits, access digital consultation notes, and book new appointments. Booked appointments appear in <strong>Requests</strong> for confirmation first.
                            </p>
                        </div>
                        <div className="pt-2">
                            <button 
                                onClick={() => document.getElementById('booking-form')?.scrollIntoView({ behavior: 'smooth' })}
                                className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all text-white font-bold rounded-full shadow-md shadow-blue-600/20 text-[15px]">
                                <Plus className="w-5 h-5" />
                                Book Appointment
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">

                    {/* Left Column (Forms & Info) */}
                    <div className="space-y-6">

                        {/* Quick Booking Card */}
                        <div id="booking-form" className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">
                                    1
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Quick Booking</h3>
                            </div>

                            <div className="space-y-6">
                                {apiError && (
                                    <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-bold animate-in fade-in">
                                        {apiError}
                                    </div>
                                )}
                                {/* Select Specialist */}
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">Select Specialist</label>
                                    <select 
                                        value={doctorName}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setDoctorName(val);
                                            const matchedDoc = doctorsList.find(d => d.name === val);
                                            if (matchedDoc) {
                                                setSpecialty(matchedDoc.specialty);
                                            } else {
                                                const specialtyMap: Record<string, string> = {
                                                    'Dr. Harpreet Singh': 'Cardiology',
                                                    'Dr. S. Subramaniam': 'Dermatology',
                                                    'Dr. Rohan R Roy': 'Neurology',
                                                    'Dr. Alok D Bhorunde': 'Orthopedics',
                                                    'Dr. Harsh S Shah': 'General Medicine',
                                                    'Dr. Laukik B Parashare': 'Pulmonology',
                                                };
                                                setSpecialty(specialtyMap[val] || 'General');
                                            }
                                        }}
                                        className="w-full bg-slate-50 hover:bg-slate-100 transition-all rounded-2xl p-4 border border-slate-100 outline-none text-[14px] font-bold text-slate-900 focus:border-blue-500"
                                    >
                                        {doctorsList.length > 0 ? (
                                            doctorsList.map((doc) => (
                                                <option key={doc.id} value={doc.name}>
                                                    {doc.name} ({doc.specialty})
                                                </option>
                                            ))
                                        ) : (
                                            <>
                                                <option value="Dr. Harpreet Singh">Dr. Harpreet Singh (Cardiology)</option>
                                                <option value="Dr. S. Subramaniam">Dr. S. Subramaniam (Dermatology)</option>
                                                <option value="Dr. Rohan R Roy">Dr. Rohan R Roy (Neurology)</option>
                                                <option value="Dr. Alok D Bhorunde">Dr. Alok D Bhorunde (Orthopedics)</option>
                                                <option value="Dr. Harsh S Shah">Dr. Harsh S Shah (General Medicine)</option>
                                                <option value="Dr. Laukik B Parashare">Dr. Laukik B Parashare (Pulmonology)</option>
                                            </>
                                        )}
                                    </select>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">Preferred Date</label>
                                        <input 
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full bg-slate-50 hover:bg-slate-100 transition-all rounded-2xl p-4 border border-slate-100 outline-none text-[14px] font-bold text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">Time Slot</label>
                                        <input 
                                            type="time"
                                            value={time}
                                            onChange={(e) => setTime(e.target.value)}
                                            className="w-full bg-slate-50 hover:bg-slate-100 transition-all rounded-2xl p-4 border border-slate-100 outline-none text-[14px] font-bold text-slate-900"
                                        />
                                    </div>
                                </div>

                                {/* Reason for Visit */}
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase">Reason for Visit</label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-100 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        placeholder="Describe your symptoms or request..."
                                    ></textarea>
                                </div>

                                <button
                                    onClick={handleQuickBook}
                                    disabled={isSubmitting || isSubmitted || !date || !time}
                                    className={`w-full py-4 font-bold text-[15px] rounded-2xl flex items-center justify-center gap-2 transition-all ${isSubmitted
                                            ? 'bg-green-100 text-green-700'
                                            : isSubmitting
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md'
                                        }`}
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                                    ) : isSubmitted ? (
                                        <><CheckCircle2 className="w-5 h-5" /> Sent to Requests!</>
                                    ) : (
                                        'Submit Request'
                                    )}
                                </button>

                                {isSubmitted && (
                                    <p className="text-xs text-center text-emerald-600 font-medium animate-in fade-in">
                                        ✓ Your appointment request is now in the <strong>Requests</strong> tab. Confirm it there to finalize.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Important Note Card */}
                        <div className="bg-[#cc5500] hover:scale-[1.02] transition-transform cursor-default rounded-[2rem] p-8 relative overflow-hidden text-white shadow-md">
                            <div className="absolute -bottom-8 -right-8 opacity-10 pointer-events-none">
                                <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                    <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                                </svg>
                            </div>

                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Info className="w-5 h-5 opacity-90" />
                                    <h3 className="text-[15px] font-bold">How Booking Works</h3>
                                </div>
                                <p className="text-[14px] leading-relaxed font-medium opacity-90">
                                    1. Submit a booking request here<br/>
                                    2. Go to <strong>Requests</strong> tab to review<br/>
                                    3. <strong>Confirm</strong> → appears in your schedule<br/>
                                    4. <strong>Reject</strong> → appointment is cancelled
                                </p>
                            </div>
                        </div>

                    </div>

                    {/* Right Column (Appointments List) */}
                    <div className="space-y-6">

                        {/* Top Bar Toggles & Legend */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center bg-slate-100/80 p-1.5 rounded-full border border-slate-200/50">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`flex items-center gap-2 px-5 py-2 font-bold text-[13px] rounded-full shadow-sm transition-all active:scale-95 ${viewMode === 'list'
                                            ? 'bg-white text-blue-600'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/50 bg-transparent shadow-none'
                                        }`}
                                >
                                    <List className="w-4 h-4" /> List View
                                </button>
                                <button
                                    onClick={() => setViewMode('calendar')}
                                    className={`flex items-center gap-2 px-5 py-2 font-bold text-[13px] rounded-full transition-all active:scale-95 ${viewMode === 'calendar'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-800 hover:bg-white/50 bg-transparent shadow-none'
                                        }`}
                                >
                                    <CalendarIcon className="w-4 h-4" /> Calendar
                                </button>
                            </div>
                            <div className="flex items-center gap-4 text-[12px] font-bold text-slate-500 hidden sm:flex">
                                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-600"></div> Confirmed</span>
                            </div>
                        </div>

                        {/* Rendering View dynamically based on state */}
                        {viewMode === 'list' ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                
                                {isLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                        <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                        <p className="font-bold">Loading confirmed appointments...</p>
                                    </div>
                                ) : appointments.length === 0 ? (
                                    <div className="bg-white rounded-[2rem] border border-slate-100 py-20 flex flex-col items-center text-center">
                                        <CalendarIcon className="w-12 h-12 text-slate-300 mb-4" />
                                        <h3 className="text-lg font-bold text-slate-700">No Confirmed Appointments</h3>
                                        <p className="text-slate-500 max-w-sm mt-2">Book an appointment using the form, then confirm it in the <strong>Requests</strong> tab to see it here.</p>
                                    </div>
                                ) : (
                                    appointments.map(apt => {
                                        const c = getStatusColor(apt.status);
                                        const aptDate = new Date(apt.appointment_date);
                                        const month = aptDate.toLocaleString('default', { month: 'short' });
                                        const day = aptDate.getDate();
                                        
                                        const [hour, minute] = apt.appointment_time.split(':');
                                        const h = parseInt(hour, 10);
                                        const ampm = h >= 12 ? 'PM' : 'AM';
                                        const formattedHour = h % 12 || 12;

                                        return (
                                            <div key={apt.id} className="bg-white rounded-[2rem] p-4 flex flex-col sm:flex-row gap-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                                {/* Date Block */}
                                                <div className="bg-slate-50 rounded-[1.5rem] w-full sm:w-32 py-5 flex flex-col items-center justify-center shrink-0 border border-slate-100/50">
                                                    <span className="text-[11px] font-extrabold text-slate-400 tracking-widest uppercase">{month}</span>
                                                    <span className="text-[2rem] font-black text-slate-900 leading-none my-1">{day}</span>
                                                    <span className={`text-[12px] font-bold ${c.text}`}>{`${formattedHour}:${minute} ${ampm}`}</span>
                                                </div>

                                                {/* Content Block */}
                                                <div className="flex-1 py-2 flex flex-col justify-center relative pr-4">
                                                    <div className="mb-3">
                                                        <span className={`inline-block px-3 py-1 ${c.bg} ${c.text} text-[10px] font-extrabold tracking-wider rounded-full uppercase`}>
                                                            {c.tag}
                                                        </span>
                                                    </div>
                                                    <h3 className="text-[18px] font-bold text-slate-900 mb-3">
                                                        {apt.specialty || 'General Consultation'}
                                                    </h3>
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
                                                            <Stethoscope className="w-4 h-4 text-slate-400" /> {apt.doctor_name}
                                                        </div>
                                                        {apt.reason && (
                                                            <div className="flex items-center gap-2 text-[13px] text-slate-500 font-medium">
                                                                <FileText className="w-4 h-4 text-blue-500" /> {apt.reason}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        ) : (
                            renderCalendar()
                        )}
                    </div>
                </div>

                {/* Bottom Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-center min-h-[140px] hover:-translate-y-1 hover:shadow-md transition-all cursor-default">
                        <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase mb-4">Confirmed Visits</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[2.5rem] font-black text-blue-600 leading-none">{appointments.length < 10 ? `0${appointments.length}` : appointments.length}</span>
                            <span className="text-[15px] font-medium text-slate-500">scheduled</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-center min-h-[140px] hover:-translate-y-1 hover:shadow-md transition-all cursor-default">
                        <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase mb-4">Unread Results</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-[2.5rem] font-black text-[#cc5500] leading-none">00</span>
                            <span className="text-[15px] font-medium text-slate-500">available</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-center min-h-[140px] hover:-translate-y-1 hover:shadow-md transition-all cursor-pointer group">
                        <span className="text-[10px] font-extrabold text-slate-400 tracking-widest uppercase mb-4">Care Team</span>
                        <div className="flex items-center pt-2">
                            <div className="flex -space-x-4">
                                <img src="https://i.pravatar.cc/150?img=47" className="w-14 h-14 rounded-full border-4 border-white object-cover bg-slate-100 z-30 group-hover:scale-110 transition-transform" alt="Doctor" />
                                <img src="https://i.pravatar.cc/150?img=11" className="w-14 h-14 rounded-full border-4 border-white object-cover bg-slate-100 z-20 group-hover:scale-110 transition-transform" alt="Doctor" />
                                <div className="w-14 h-14 rounded-full border-4 border-white bg-slate-100 z-0 flex items-center justify-center text-[14px] font-bold text-slate-500 shadow-sm group-hover:bg-slate-200 transition-colors">
                                    +1
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
