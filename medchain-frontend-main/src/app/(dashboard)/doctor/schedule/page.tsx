'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    CalendarDays, List, ChevronLeft, ChevronRight,
    Clock, Stethoscope, User, FileText, Loader2,
    CheckCircle2, AlertCircle, XCircle, Calendar
} from 'lucide-react';
import { appointmentsApi, Appointment } from '@/lib/api/appointments';

type Filter = 'all' | 'today' | 'week' | 'pending';

function getPatientName(apt: Appointment) {
    if (apt.patient_first_name || apt.patient_last_name) {
        return `${apt.patient_first_name || ''} ${apt.patient_last_name || ''}`.trim();
    }
    return apt.patient_email || 'Anonymous Patient';
}

function getPatientInitials(apt: Appointment) {
    const name = getPatientName(apt);
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name[0]?.toUpperCase() || 'P';
}

function formatTime(timeStr: string) {
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${minute} ${ampm}`;
}

function isToday(dateStr: string) {
    const today = new Date();
    const d = new Date(dateStr);
    return d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
}

function isThisWeek(dateStr: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    const d = new Date(dateStr);
    return d >= sunday && d <= saturday;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.FC<any> }> = {
    Confirmed: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
    Pending:   { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700', icon: Clock },
    Cancelled: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: XCircle },
};

export default function DoctorSchedulePage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>('all');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [calMonth, setCalMonth] = useState(() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() };
    });

    useEffect(() => {
        const load = async () => {
            try {
                const data = await appointmentsApi.getDoctorSchedule();
                setAppointments(data);
            } catch (e) {
                console.error('Failed to load schedule', e);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const filtered = useMemo(() => {
        return appointments.filter(apt => {
            if (filter === 'today') return isToday(apt.appointment_date);
            if (filter === 'week') return isThisWeek(apt.appointment_date);
            if (filter === 'pending') return apt.status?.toLowerCase() === 'pending';
            return true;
        });
    }, [appointments, filter]);

    const counts = useMemo(() => ({
        all: appointments.length,
        today: appointments.filter(a => isToday(a.appointment_date)).length,
        week: appointments.filter(a => isThisWeek(a.appointment_date)).length,
        pending: appointments.filter(a => a.status?.toLowerCase() === 'pending').length,
    }), [appointments]);

    // --- Calendar helpers ---
    const { year, month } = calMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const calApts = useMemo(() =>
        appointments.reduce<Record<number, Appointment[]>>((acc, apt) => {
            const d = new Date(apt.appointment_date);
            if (d.getFullYear() === year && d.getMonth() === month) {
                const day = d.getDate();
                if (!acc[day]) acc[day] = [];
                acc[day].push(apt);
            }
            return acc;
        }, {}), [appointments, year, month]);

    const today = new Date();

    return (
        <div className="min-h-full bg-[#F8FAFC] pb-16">
            <div className="max-w-[1300px] mx-auto p-8 space-y-8 animate-in fade-in duration-500">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-[2.25rem] font-extrabold tracking-tight text-slate-900">Schedule</h1>
                        <p className="text-slate-500 font-medium mt-1 text-[15px]">
                            {counts.today > 0
                                ? `You have ${counts.today} appointment${counts.today !== 1 ? 's' : ''} today`
                                : 'No appointments scheduled for today'}
                        </p>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full p-1.5 shadow-sm">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-[13px] transition-all ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <List className="w-4 h-4" /> List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-[13px] transition-all ${viewMode === 'calendar' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                            <CalendarDays className="w-4 h-4" /> Calendar
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                {viewMode === 'list' && (
                    <div className="flex gap-2 flex-wrap">
                        {(['all', 'today', 'week', 'pending'] as Filter[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] border transition-all ${filter === f
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200 hover:text-emerald-700'}`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${filter === f ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {counts[f]}
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-slate-500 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                        <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-4" />
                        <p className="font-bold text-lg">Loading your schedule...</p>
                    </div>
                ) : viewMode === 'list' ? (

                    /* ===== LIST VIEW ===== */
                    filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center">
                            <CalendarDays className="w-14 h-14 text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-700">No appointments found</h3>
                            <p className="text-slate-500 mt-2 max-w-xs">
                                {filter === 'today' ? 'No appointments scheduled for today.' :
                                 filter === 'week' ? 'No appointments this week.' :
                                 filter === 'pending' ? 'No pending requests to review.' :
                                 'Your schedule is clear.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map(apt => {
                                const name = getPatientName(apt);
                                const initials = getPatientInitials(apt);
                                const s = STATUS_STYLES[apt.status] || STATUS_STYLES.Confirmed;
                                const StatusIcon = s.icon;
                                const aptDate = new Date(apt.appointment_date);
                                const isAptToday = isToday(apt.appointment_date);

                                return (
                                    <div
                                        key={apt.id}
                                        className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group relative overflow-hidden"
                                    >
                                        {/* Left color bar */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[2rem] ${
                                            apt.status === 'Confirmed' ? 'bg-emerald-500' :
                                            apt.status === 'Pending' ? 'bg-orange-500' : 'bg-red-400'
                                        }`} />

                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pl-4">
                                            {/* Date block */}
                                            <div className={`shrink-0 w-20 rounded-2xl text-center py-3 border ${isAptToday ? 'bg-emerald-600 border-emerald-600' : 'bg-slate-50 border-slate-100'}`}>
                                                <p className={`text-[10px] font-extrabold tracking-wider uppercase ${isAptToday ? 'text-emerald-100' : 'text-slate-400'}`}>
                                                    {aptDate.toLocaleString('default', { month: 'short' })}
                                                </p>
                                                <p className={`text-[1.75rem] font-black leading-none my-1 ${isAptToday ? 'text-white' : 'text-slate-900'}`}>
                                                    {aptDate.getDate()}
                                                </p>
                                                <p className={`text-[10px] font-bold ${isAptToday ? 'text-emerald-200' : 'text-slate-500'}`}>
                                                    {aptDate.toLocaleString('default', { weekday: 'short' })}
                                                </p>
                                            </div>

                                            {/* Patient avatar */}
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                                {initials}
                                            </div>

                                            {/* Main info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                                    <h3 className="text-[17px] font-extrabold text-slate-900">{name}</h3>
                                                    {isAptToday && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-extrabold rounded-full tracking-wider">TODAY</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-500">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {formatTime(apt.appointment_time)}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Stethoscope className="w-3.5 h-3.5" />
                                                        {apt.specialty || 'General Consultation'}
                                                    </span>
                                                    {apt.reason && (
                                                        <span className="flex items-center gap-1.5 max-w-[250px] truncate">
                                                            <FileText className="w-3.5 h-3.5 shrink-0" />
                                                            {apt.reason}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: status + action */}
                                            <div className="flex items-center gap-3 shrink-0">
                                                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold border ${s.bg} ${s.text}`}>
                                                    <StatusIcon className="w-3.5 h-3.5" />
                                                    {apt.status}
                                                </span>
                                                {apt.patient_id && (
                                                    <button
                                                        onClick={() => router.push(`/doctor/records?patientId=${apt.patient_id}&patientName=${encodeURIComponent(name)}`)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold px-4 py-2 rounded-full"
                                                    >
                                                        View Records
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )

                ) : (

                    /* ===== CALENDAR VIEW ===== */
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        {/* Month navigator */}
                        <div className="flex items-center justify-between mb-8">
                            <button
                                onClick={() => setCalMonth(m => {
                                    const d = new Date(m.year, m.month - 1, 1);
                                    return { year: d.getFullYear(), month: d.getMonth() };
                                })}
                                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h3 className="text-xl font-extrabold text-slate-900">
                                {monthNames[month]} {year}
                            </h3>
                            <button
                                onClick={() => setCalMonth(m => {
                                    const d = new Date(m.year, m.month + 1, 1);
                                    return { year: d.getFullYear(), month: d.getMonth() };
                                })}
                                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition-colors"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Weekday headers */}
                        <div className="grid grid-cols-7 mb-3">
                            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                                <div key={d} className="text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider py-2">{d}</div>
                            ))}
                        </div>

                        {/* Calendar grid */}
                        <div className="grid grid-cols-7 gap-2">
                            {/* Empty leading cells */}
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`e-${i}`} className="min-h-[90px] rounded-xl bg-slate-50" />
                            ))}
                            {/* Day cells */}
                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                                const dayApts = calApts[day] || [];
                                const isCurrentDay = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                                return (
                                    <div
                                        key={day}
                                        className={`min-h-[90px] rounded-xl p-2 flex flex-col border transition-all ${
                                            isCurrentDay
                                                ? 'bg-emerald-600 border-emerald-600 shadow-md shadow-emerald-600/20'
                                                : dayApts.length > 0
                                                    ? 'bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50'
                                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                        }`}
                                    >
                                        <span className={`text-[12px] font-extrabold self-end mb-1 ${isCurrentDay ? 'text-white' : 'text-slate-600'}`}>
                                            {day}
                                        </span>
                                        <div className="space-y-1 flex-1 overflow-hidden">
                                            {dayApts.slice(0, 2).map(apt => (
                                                <div
                                                    key={apt.id}
                                                    className={`text-[9px] font-bold px-1.5 py-1 rounded-lg truncate cursor-pointer ${
                                                        apt.status === 'Confirmed'
                                                            ? isCurrentDay ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                                                            : apt.status === 'Pending'
                                                                ? 'bg-orange-100 text-orange-800'
                                                                : 'bg-red-100 text-red-800'
                                                    }`}
                                                    title={`${getPatientName(apt)} — ${formatTime(apt.appointment_time)}`}
                                                >
                                                    {formatTime(apt.appointment_time)} {getPatientName(apt).split(' ')[0]}
                                                </div>
                                            ))}
                                            {dayApts.length > 2 && (
                                                <div className={`text-[9px] font-extrabold ${isCurrentDay ? 'text-emerald-100' : 'text-slate-400'}`}>
                                                    +{dayApts.length - 2} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-100 text-[12px] font-bold text-slate-500">
                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Confirmed</span>
                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Pending</span>
                            <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Cancelled</span>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
