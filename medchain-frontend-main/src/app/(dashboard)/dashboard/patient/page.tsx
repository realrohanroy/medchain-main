'use client';

import { useEffect, useState } from "react";
import {
    ShieldCheck, FileText, CalendarDays, FolderOpen,
    FileClock, HardDriveUpload, ActivitySquare, LogIn, ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { recordsApi, RecordItem } from "@/lib/api/records";
import { appointmentsApi, Appointment } from "@/lib/api/appointments";
import { accessApi, AccessRequestModel } from "@/lib/api/access";
import apiClient from "@/lib/api/client";

interface DashboardData {
    firstName: string;
    lastName: string;
    userId: string;
    totalRecords: number;
    upcomingAppointments: Appointment[];
    pendingRequests: number;
    recentRecords: RecordItem[];
    latestVitals: {
        heart_rate_bpm: number | null;
        blood_pressure_sys: number | null;
        blood_pressure_dia: number | null;
        temperature_c: number | null;
        recorded_at: string;
    } | null;
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr: string) {
    const [h, m] = timeStr.split(':');
    const d = new Date();
    d.setHours(parseInt(h), parseInt(m));
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return formatDate(dateStr);
}

const STATUS_STYLE: Record<string, string> = {
    Confirmed: 'bg-blue-50 text-blue-600',
    Pending: 'bg-orange-50 text-orange-600',
    Completed: 'bg-green-50 text-green-600',
    Cancelled: 'bg-red-50 text-red-500',
};

const RECORD_TYPE_ICON_COLOR: Record<string, string> = {
    'Blood Test': 'text-red-500',
    'ECG Report': 'text-blue-500',
    'Prescription': 'text-green-600',
    'HbA1c Report': 'text-purple-500',
    'Lipid Profile': 'text-orange-500',
    'Discharge Summary': 'text-slate-600',
    'Physiotherapy Report': 'text-teal-600',
    'Pulmonology Report': 'text-sky-600',
    'Diet & Lifestyle Plan': 'text-lime-600',
};

export default function PatientDashboard() {
    const router = useRouter();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAll() {
            try {
                const firstName = localStorage.getItem('user_first_name') || '';
                const lastName = localStorage.getItem('user_last_name') || '';
                const userId = localStorage.getItem('user_id') || '';

                const [recordsRes, appointmentsRes, requestsRes] = await Promise.all([
                    recordsApi.getTimeline(1),
                    appointmentsApi.getAppointments(1),
                    accessApi.getRequests(),
                ]);

                const today = new Date().toISOString().split('T')[0];
                const upcoming = (appointmentsRes.results || [])
                    .filter((a: Appointment) => a.appointment_date >= today && a.status !== 'Cancelled')
                    .sort((a: Appointment, b: Appointment) => a.appointment_date.localeCompare(b.appointment_date))
                    .slice(0, 2);

                const pendingCount = (requestsRes as AccessRequestModel[])
                    .filter((r) => r.status === 'Pending').length;

                const recentRecords = (recordsRes.results || []).slice(0, 4);

                // Fetch latest vitals for this patient
                let latestVitals = null;
                if (userId) {
                    try {
                        const vitalsRes = await apiClient.get(`/clinical/${userId}/records/`);
                        const vitalsList = vitalsRes.data?.vitals || [];
                        if (vitalsList.length > 0) {
                            latestVitals = vitalsList[0];
                        }
                    } catch {
                        // vitals unavailable — no crash
                    }
                }

                setData({
                    firstName,
                    lastName,
                    userId,
                    totalRecords: recordsRes.count,
                    upcomingAppointments: upcoming,
                    pendingRequests: pendingCount,
                    recentRecords,
                    latestVitals,
                });
            } catch (e) {
                console.error('Dashboard fetch error', e);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, []);

    const displayName = data
        ? (data.firstName ? `${data.firstName}` : 'Patient')
        : '...';

    return (
        <div className="min-h-full bg-slate-50/50 pb-16">
            <div className="flex-1 space-y-10 p-8 max-w-[1100px] animate-in fade-in duration-500 mt-2">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-[2rem] font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            {getGreeting()}, {displayName} 👋
                        </h2>
                        <p className="text-slate-500 font-semibold mt-2 text-[15px]">
                            Your health records are up to date and secured via blockchain.
                        </p>
                    </div>
                    <div className="flex items-center">
                        <div className="flex items-center gap-2 px-5 py-2.5 bg-blue-50/80 text-blue-600 font-bold rounded-full shadow-sm text-sm border border-blue-100/50 hover:bg-blue-100 hover:shadow-md cursor-pointer transition-all active:scale-95">
                            <ShieldCheck className="w-4 h-4" />
                            Identity Verified
                        </div>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card onClick={() => router.push('/records')} className="relative overflow-hidden border border-slate-100 shadow-sm rounded-[2rem] bg-white group hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
                        <div className="absolute right-[-10%] top-[-10%] opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                            <HardDriveUpload className="w-[300px] h-[300px] text-blue-600" />
                        </div>
                        <CardContent className="p-8 pb-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <HardDriveUpload className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-[1.35rem] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Upload Medical Record</h3>
                                <p className="text-slate-500 font-medium max-w-[85%] leading-relaxed">
                                    Securely store your reports and lab results in your private vault.
                                </p>
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full py-6 text-[15px] font-bold shadow-md transition-all">
                                Upload
                            </Button>
                        </CardContent>
                    </Card>

                    <Card onClick={() => router.push('/appointments')} className="relative overflow-hidden border border-slate-100 shadow-sm rounded-[2rem] bg-white group hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer">
                        <div className="absolute right-[-10%] top-[-10%] opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                            <CalendarDays className="w-[300px] h-[300px] text-blue-600" />
                        </div>
                        <CardContent className="p-8 pb-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <CalendarDays className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-[1.35rem] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Book Appointment</h3>
                                <p className="text-slate-500 font-medium max-w-[85%] leading-relaxed">
                                    Schedule a consultation with top-rated doctors in our network.
                                </p>
                            </div>
                            <Button className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-full py-6 text-[15px] font-bold shadow-md transition-all">
                                Book Now
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Row */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card onClick={() => router.push('/records')} className="border-0 shadow-sm rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex items-center group">
                        <CardContent className="p-6 flex items-center justify-center gap-5 w-full">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100 group-hover:border-blue-200 transition-colors">
                                <FolderOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[11px] font-extrabold text-slate-500 tracking-widest mb-1">TOTAL RECORDS</p>
                                <h4 className="text-[1.75rem] font-extrabold text-slate-900 leading-none">
                                    {loading ? '—' : String(data?.totalRecords ?? 0).padStart(2, '0')}
                                </h4>
                            </div>
                        </CardContent>
                    </Card>

                    <Card onClick={() => router.push('/appointments')} className="border-0 shadow-sm rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex items-center group">
                        <CardContent className="p-6 flex items-center justify-center gap-5 w-full">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100 group-hover:border-blue-200 transition-colors">
                                <CalendarDays className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[11px] font-extrabold text-slate-500 tracking-widest mb-1">UPCOMING</p>
                                <h4 className="text-[1.75rem] font-extrabold text-slate-900 leading-none">
                                    {loading ? '—' : String(data?.upcomingAppointments.length ?? 0).padStart(2, '0')}
                                </h4>
                            </div>
                        </CardContent>
                    </Card>

                    <Card onClick={() => router.push('/access')} className="border-0 shadow-sm rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex items-center group">
                        <CardContent className="p-6 flex items-center justify-center gap-5 w-full">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100 group-hover:border-blue-200 transition-colors">
                                <FileClock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[11px] font-extrabold text-slate-500 tracking-widest mb-1">PENDING REQUESTS</p>
                                <h4 className="text-[1.75rem] font-extrabold text-slate-900 leading-none">
                                    {loading ? '—' : String(data?.pendingRequests ?? 0).padStart(2, '0')}
                                </h4>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section */}
                <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] items-start pt-2">
                    <div className="space-y-10">
                        {/* Upcoming Appointments */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">Upcoming Appointments</h3>
                                <a href="#" onClick={(e) => { e.preventDefault(); router.push('/appointments'); }} className="text-[13px] font-bold text-blue-600 hover:text-blue-800 active:scale-95 transition-all">View all</a>
                            </div>
                            <div className="space-y-4">
                                {loading ? (
                                    <div className="text-slate-400 text-sm font-medium animate-pulse p-4">Loading appointments...</div>
                                ) : data?.upcomingAppointments.length === 0 ? (
                                    <Card className="border border-slate-100/50 rounded-[1.5rem] bg-white">
                                        <CardContent className="p-8 text-center text-slate-400 font-medium">
                                            No upcoming appointments. <span className="text-blue-500 cursor-pointer hover:underline" onClick={() => router.push('/appointments')}>Book one?</span>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    data?.upcomingAppointments.map((appt) => (
                                        <Card key={appt.id} onClick={() => router.push('/appointments')} className="border border-slate-100/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-0.5 transition-all rounded-[1.5rem] bg-white cursor-pointer group">
                                            <CardContent className="p-5 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                                        <img
                                                            src={`https://i.pravatar.cc/150?u=${appt.doctor_name}`}
                                                            alt={appt.doctor_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{appt.doctor_name}</h4>
                                                        <p className="text-[13px] font-medium text-slate-500 mt-0.5">{appt.specialty}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-5 shrink-0">
                                                    <div className="text-right">
                                                        <div className="text-[14px] font-bold text-slate-900">{formatDate(appt.appointment_date)}</div>
                                                        <div className="text-[12px] font-medium text-slate-500 mt-0.5">{formatTime(appt.appointment_time)}</div>
                                                    </div>
                                                    <span className={`px-3.5 py-1.5 text-[11px] font-bold rounded-full ${STATUS_STYLE[appt.status] || 'bg-slate-100 text-slate-600'}`}>
                                                        {appt.status}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Health Status Overview */}
                        <Card className="border border-slate-100/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow rounded-[1.5rem] bg-gradient-to-br from-orange-50/20 to-orange-50/40 cursor-pointer group">
                            <CardContent className="p-7">
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Health Status Overview</h3>
                                        <p className="text-[13px] text-slate-500 font-medium mt-1">
                                            {data?.latestVitals
                                                ? `Last measured ${timeAgo(data.latestVitals.recorded_at)}`
                                                : 'No vitals recorded yet'}
                                        </p>
                                    </div>
                                    <div className="text-orange-600/80 group-hover:scale-110 transition-transform">
                                        <ActivitySquare className="w-6 h-6" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-100/50 hover:-translate-y-1 hover:shadow-md transition-all">
                                        <span className="text-[10px] font-extrabold text-slate-400 tracking-widest mb-3 block">HEART RATE</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-extrabold text-slate-900">
                                                {data?.latestVitals?.heart_rate_bpm ?? '—'}
                                            </span>
                                            {data?.latestVitals?.heart_rate_bpm && <span className="text-xs font-bold text-slate-400">bpm</span>}
                                        </div>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-100/50 hover:-translate-y-1 hover:shadow-md transition-all">
                                        <span className="text-[10px] font-extrabold text-slate-400 tracking-widest mb-3 block">BP</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-extrabold text-slate-900">
                                                {data?.latestVitals?.blood_pressure_sys && data?.latestVitals?.blood_pressure_dia
                                                    ? `${data.latestVitals.blood_pressure_sys}/${data.latestVitals.blood_pressure_dia}`
                                                    : '—'}
                                            </span>
                                            {data?.latestVitals?.blood_pressure_sys && <span className="text-xs font-bold text-slate-400">mmHg</span>}
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 rounded-2xl p-5 shadow-sm border border-orange-100/50 hover:-translate-y-1 hover:shadow-md transition-all">
                                        <span className="text-[10px] font-extrabold text-orange-600/80 tracking-widest mb-3 block">TEMP</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-extrabold text-orange-600">
                                                {data?.latestVitals?.temperature_c ?? '—'}
                                            </span>
                                            {data?.latestVitals?.temperature_c && <span className="text-xs font-bold text-orange-400">°C</span>}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity — latest records */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
                        {loading ? (
                            <div className="text-slate-400 text-sm animate-pulse">Loading activity...</div>
                        ) : (data?.recentRecords?.length ?? 0) === 0 ? (
                            <p className="text-slate-400 text-sm font-medium">No records uploaded yet.</p>
                        ) : (
                            <div className="relative pl-6 lg:pl-8 space-y-10 before:absolute before:inset-0 before:left-3.5 before:h-full before:w-[2px] before:bg-slate-100">
                                {data?.recentRecords.map((rec) => (
                                    <div key={rec.id} className="relative flex items-start gap-5 group cursor-pointer" onClick={() => router.push('/records')}>
                                        <div className="absolute top-0 left-[-1.9rem] w-8 h-8 rounded-full bg-blue-50/80 ring-4 ring-white flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                                            <FileText className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="pt-0.5 group-hover:translate-x-1 transition-transform">
                                            <p className="text-[12px] font-bold text-slate-500 mb-1">
                                                {rec.record_date ? formatDate(rec.record_date) : 'Unknown date'}
                                            </p>
                                            <h4 className="text-[14px] font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                                                {rec.record_type || 'Medical Record'}
                                            </h4>
                                            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                                {rec.doctor_name ? `By ${rec.doctor_name}` : ''}
                                                {rec.source_facility ? ` · ${rec.source_facility}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div className="relative flex items-start gap-5 group cursor-pointer" onClick={() => router.push('/records')}>
                                    <div className="absolute top-0 left-[-1.9rem] w-8 h-8 rounded-full border border-slate-200 bg-white ring-4 ring-white flex items-center justify-center text-slate-400 shrink-0 group-hover:scale-110 transition-transform">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="pt-1.5 group-hover:translate-x-1 transition-transform">
                                        <span className="text-[13px] font-bold text-blue-600 hover:text-blue-800">View all records</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
