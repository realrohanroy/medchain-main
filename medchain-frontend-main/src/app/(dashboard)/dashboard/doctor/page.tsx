'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { accessApi } from '@/lib/api/access';
import { appointmentsApi, Appointment } from '@/lib/api/appointments';
import { authApi } from '@/lib/api/auth';
import {
    Users, CalendarDays, ClipboardList, CheckCircle2,
    Clock, AlertCircle, HeartPulse, FileText, ArrowRight, Activity, Loader2
} from 'lucide-react';

function getPatientName(apt: Appointment) {
    if (apt.patient_first_name || apt.patient_last_name) {
        return `${apt.patient_first_name || ''} ${apt.patient_last_name || ''}`.trim();
    }
    return apt.patient_email || 'Anonymous Patient';
}

function isToday(dateStr: string) {
    const today = new Date();
    const d = new Date(dateStr);
    return d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
}

export default function DoctorDashboard() {
    const router = useRouter();
    const [doctorName, setDoctorName] = useState('Doctor');
    const [stats, setStats] = useState({ patients: 0, appointments: 0, pendingRequests: 0 });
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
    const [pendingRequests, setPendingRequests] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        // Get doctor name — try localStorage first (set at login), fall back to /auth/me/
        const storedFirst = localStorage.getItem('user_first_name') || '';
        const storedLast = localStorage.getItem('user_last_name') || '';
        if (storedFirst) {
            setDoctorName(storedFirst);
        } else {
            authApi.getProfile().then(profile => {
                const name = profile.first_name || profile.email || 'Doctor';
                setDoctorName(name);
                if (profile.first_name) localStorage.setItem('user_first_name', profile.first_name);
                if (profile.last_name) localStorage.setItem('user_last_name', profile.last_name);
            }).catch(() => {});
        }

        const loadData = async () => {
            try {
                const [grants, allApts] = await Promise.all([
                    accessApi.getGrants(),
                    appointmentsApi.getDoctorSchedule(),
                ]);

                const todayApts = allApts.filter(a => isToday(a.appointment_date) && a.status !== 'Cancelled');
                const pending = allApts.filter(a => a.status?.toLowerCase() === 'pending');

                setStats({
                    patients: grants.length,
                    appointments: todayApts.length,
                    pendingRequests: pending.length,
                });
                setTodayAppointments(todayApts);
                setPendingRequests(pending.slice(0, 3));
            } catch (e) {
                console.error('Failed to load dashboard data', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleConfirm = async (id: string) => {
        setIsProcessing(id);
        try {
            await appointmentsApi.confirmAppointment(id);
            window.location.reload();
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(null);
        }
    };

    const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="min-h-full bg-[#F8FAFC] pb-16">
            <div className="flex-1 space-y-8 p-8 max-w-[1200px] animate-in fade-in duration-500">

                {/* Header */}
                <div>
                    <h2 className="text-[2.25rem] font-extrabold tracking-tight text-slate-900">
                        Doctor Command Center
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 text-[15px]">
                        {isLoading
                            ? 'Loading your schedule...'
                            : `Welcome back, Dr. ${doctorName}. ${stats.appointments > 0
                                ? `You have ${stats.appointments} appointment${stats.appointments !== 1 ? 's' : ''} today.`
                                : 'No appointments scheduled for today.'}`
                        }
                    </p>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Patients (Granted Access) */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-default">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Users className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold tracking-wider text-slate-400 uppercase">Granted Access</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 mt-0.5">
                                {isLoading ? '—' : stats.patients.toString().padStart(2, '0')}
                            </h3>
                            <p className="text-[13px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5" /> patients
                            </p>
                        </div>
                    </div>

                    {/* Today's Appointments */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-default">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                            <CalendarDays className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold tracking-wider text-slate-400 uppercase">Today</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 mt-0.5">
                                {isLoading ? '—' : stats.appointments.toString().padStart(2, '0')}
                            </h3>
                            <p className="text-[13px] font-medium text-slate-500 mt-1">
                                {todayAppointments.length > 0
                                    ? `Next: ${todayAppointments[0].appointment_time.slice(0, 5)}`
                                    : 'No visits today'}
                            </p>
                        </div>
                    </div>

                    {/* Pending Requests */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-5 hover:shadow-md transition-all cursor-default">
                        <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                            <ClipboardList className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-[12px] font-bold tracking-wider text-slate-400 uppercase">Pending Requests</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 mt-0.5">
                                {isLoading ? '—' : stats.pendingRequests.toString().padStart(2, '0')}
                            </h3>
                            {stats.pendingRequests > 0 && (
                                <p className="text-[13px] font-bold text-orange-500 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> awaiting review
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Today's Schedule */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <h3 className="text-2xl font-bold text-slate-900">Today's Schedule</h3>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                                    {todayStr}
                                </span>
                            </div>
                            <button
                                onClick={() => router.push('/doctor/schedule')}
                                className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                            >
                                View Full Calendar <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {isLoading ? (
                                <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center shadow-sm">
                                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-3" />
                                    <p className="text-slate-500 font-bold">Loading schedule...</p>
                                </div>
                            ) : todayAppointments.length === 0 ? (
                                <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center text-slate-500 font-bold shadow-sm">
                                    <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                    No appointments scheduled for today.
                                </div>
                            ) : todayAppointments.map((apt) => {
                                const [hour, minute] = apt.appointment_time.split(':');
                                const h = parseInt(hour, 10);
                                const ampm = h >= 12 ? 'PM' : 'AM';
                                const formattedHour = h % 12 || 12;
                                const pName = getPatientName(apt);
                                const isPending = apt.status?.toLowerCase() === 'pending';
                                const isCancelled = apt.status?.toLowerCase() === 'cancelled';

                                return (
                                    <div key={apt.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-all relative overflow-hidden">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isPending ? 'bg-orange-500' : isCancelled ? 'bg-red-500' : 'bg-emerald-600'}`} />
                                        <div className="flex items-center gap-6 pl-4">
                                            <div className="text-center w-16">
                                                <p className={`text-lg font-bold ${isPending ? 'text-orange-600' : isCancelled ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {formattedHour}:{minute}
                                                </p>
                                                <p className="text-xs font-medium text-slate-400 uppercase">{ampm}</p>
                                            </div>
                                            <div className="w-12 h-12 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm uppercase">
                                                {pName[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg">{pName}</h4>
                                                <p className="text-sm text-slate-500 mt-0.5">{apt.specialty || 'General Consultation'}{apt.reason ? ` • ${apt.reason}` : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-4 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                                                isPending
                                                    ? 'bg-orange-50 text-orange-600'
                                                    : isCancelled
                                                        ? 'bg-red-50 text-red-600'
                                                        : 'bg-emerald-600 text-white'
                                            }`}>
                                                {apt.status}
                                            </span>
                                            {apt.patient_id && (
                                                <button
                                                    onClick={() => router.push(`/doctor/records?patientId=${apt.patient_id}&patientName=${encodeURIComponent(pName)}`)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold text-emerald-600 hover:text-emerald-800"
                                                >
                                                    Records
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Column: Pending Requests */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-slate-900">Pending Requests</h3>
                                {stats.pendingRequests > 0 && (
                                    <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-bold rounded-md">
                                        {stats.pendingRequests}
                                    </span>
                                )}
                            </div>

                            <div className="space-y-4">
                                {isLoading ? (
                                    <div className="text-center py-6">
                                        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                                    </div>
                                ) : pendingRequests.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-xs font-bold">
                                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                                        All caught up!
                                    </div>
                                ) : pendingRequests.map(apt => {
                                    const pName = getPatientName(apt);
                                    return (
                                        <div key={apt.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                                            <div className="flex gap-4">
                                                <div className="mt-1">
                                                    <CalendarDays className="w-5 h-5 text-orange-500" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-[13px] font-bold text-slate-900">{pName}</h4>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        {new Date(apt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {apt.appointment_time.slice(0, 5)} • {apt.specialty || 'General'}
                                                    </p>
                                                    <div className="flex gap-2 mt-3">
                                                        <button
                                                            disabled={isProcessing === apt.id}
                                                            onClick={() => handleConfirm(apt.id)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold py-1.5 px-4 rounded-full transition-colors flex items-center gap-1"
                                                        >
                                                            {isProcessing === apt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                                                            Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => router.push('/doctor/approvals')}
                                                            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-bold py-1.5 px-4 rounded-full transition-colors"
                                                        >
                                                            Review
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => router.push('/doctor/approvals')}
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
                                >
                                    View all pending requests
                                </button>
                            </div>
                        </div>

                        {/* Quick Nav Card */}
                        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[2rem] p-6 text-white shadow-md">
                            <h3 className="text-xs font-extrabold tracking-wider uppercase mb-4 text-emerald-100">Quick Navigation</h3>
                            <div className="space-y-2">
                                {[
                                    { label: 'Full Schedule', href: '/doctor/schedule' },
                                    { label: 'Patient Directory', href: '/doctor/patients' },
                                    { label: 'Approvals', href: '/doctor/approvals' },
                                ].map(item => (
                                    <button
                                        key={item.href}
                                        onClick={() => router.push(item.href)}
                                        className="w-full text-left py-2.5 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold text-white transition-colors flex items-center justify-between"
                                    >
                                        {item.label}
                                        <ArrowRight className="w-4 h-4 opacity-70" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
