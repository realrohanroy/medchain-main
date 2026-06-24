'use client';

import { useState, useEffect } from 'react';
import { 
    CalendarDays, User, Folder, TrendingUp, TrendingDown, 
    Calendar, ChevronRight, FileText, Download, Loader2
} from 'lucide-react';
import { analyticsApi, DoctorAnalyticsResponse } from '@/lib/api/analytics';

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState('Last 30 days');
    const [stats, setStats] = useState<DoctorAnalyticsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await analyticsApi.getDoctorAnalytics();
                setStats(data);
            } catch (error) {
                console.error("Failed to load analytics", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Calculate percentages for donut chart
    const types = stats?.record_types || {};
    const totalRecords = stats?.total_records || 1; // avoid division by zero
    
    // Sort types by count to get top 2
    const sortedTypes = Object.entries(types).sort((a, b) => b[1] - a[1]);
    const top1 = sortedTypes[0] || ['Reports', 0];
    const top2 = sortedTypes[1] || ['Other', 0];

    const pct1 = Math.round((top1[1] / totalRecords) * 100) || 0;
    const pct2 = Math.round((top2[1] / totalRecords) * 100) || 0;

    return (
        <div className="min-h-full bg-[#F8FAFC] pb-16 flex justify-center">
            <div className="flex-1 max-w-[1200px] w-full p-8 animate-in fade-in duration-500">
                
                {/* Header Row */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <h2 className="text-[2.25rem] font-extrabold tracking-tight text-slate-900">
                            Reports & Analytics
                        </h2>
                        <p className="text-slate-500 font-medium mt-1 text-[15px]">
                            Operational insights and performance metrics.
                        </p>
                    </div>

                    <div className="flex items-center bg-white rounded-full p-1 border border-slate-200 shadow-sm">
                        {['Last 7 days', 'Last 30 days', 'Year'].map(range => (
                            <button 
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-2 text-[13px] font-bold rounded-full transition-all ${
                                    timeRange === range 
                                        ? 'bg-blue-50 text-blue-600 shadow-sm' 
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                {range}
                            </button>
                        ))}
                        <div className="w-[1px] h-6 bg-slate-200 mx-2"></div>
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors mr-1">
                            <Calendar className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <>
                        {/* Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Patients */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-0"></div>
                                <div className="relative z-10 flex justify-between items-start mb-8">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-[11px] font-bold">
                                        <TrendingUp className="w-3 h-3" /> +1
                                    </span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">Total Patients</p>
                                    <h3 className="text-4xl font-extrabold text-slate-900">{stats?.total_patients || 0}</h3>
                                </div>
                            </div>

                            {/* Records */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-0"></div>
                                <div className="relative z-10 flex justify-between items-start mb-8">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <Folder className="w-5 h-5" />
                                    </div>
                                    <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-[11px] font-bold">
                                        <TrendingUp className="w-3 h-3" /> +1
                                    </span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">Total Records</p>
                                    <h3 className="text-4xl font-extrabold text-slate-900">{stats?.total_records || 0}</h3>
                                </div>
                            </div>

                            {/* Appointments */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-0"></div>
                                <div className="relative z-10 flex justify-between items-start mb-8">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <CalendarDays className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase mb-1">Appointments</p>
                                    <h3 className="text-4xl font-extrabold text-slate-900">{stats?.total_appointments || 0}</h3>
                                </div>
                            </div>
                        </div>

                        {/* Charts Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            
                            {/* Appointments Trend Chart */}
                            <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900">Appointments Trend</h3>
                                        <p className="text-[13px] font-medium text-slate-500 mt-1">Patient volume over time</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>Completed</div>
                                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>Cancelled</div>
                                    </div>
                                </div>

                                {/* Pure CSS Bar Chart */}
                                <div className="h-[240px] flex items-end justify-between gap-4 mt-8 pt-4 border-b border-slate-100 pb-2">
                                    {[
                                        { label: 'MON', total: 60, completed: 40 },
                                        { label: 'TUE', total: 80, completed: 55 },
                                        { label: 'WED', total: 85, completed: 50 },
                                        { label: 'THU', total: 100, completed: 75 },
                                        { label: 'FRI', total: 110, completed: 85 },
                                        { label: 'SAT', total: 140, completed: 130 },
                                        { label: 'SUN', total: 120, completed: 90 },
                                    ].map(day => (
                                        <div key={day.label} className="w-full flex flex-col items-center group">
                                            <div className="w-full max-w-[40px] relative flex items-end justify-center h-[200px]">
                                                {/* Background Bar (Total) */}
                                                <div className="absolute bottom-0 w-full bg-slate-100 rounded-t-md transition-all duration-500 group-hover:bg-slate-200" style={{ height: `${(day.total / 150) * 100}%` }}></div>
                                                {/* Foreground Bar (Completed) */}
                                                <div className="absolute bottom-0 w-full bg-[#8FB0E8] rounded-t-md transition-all duration-500 group-hover:bg-blue-500" style={{ height: `${(day.completed / 150) * 100}%` }}></div>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 mt-4">{day.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Record Types Donut */}
                            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 flex flex-col">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Record Types</h3>
                                    <p className="text-[13px] font-medium text-slate-500 mt-1">Distribution of digital assets</p>
                                </div>

                                {/* Pure CSS Donut Chart */}
                                <div className="flex-1 flex items-center justify-center py-8">
                                    <div className="relative w-48 h-48 rounded-full flex items-center justify-center bg-slate-100"
                                        style={{
                                            background: `conic-gradient(#1D4ED8 0% ${pct1}%, #E2E8F0 ${pct1}% ${pct1 + pct2}%, transparent ${pct1 + pct2}% 100%)`
                                        }}
                                    >
                                        <div className="w-36 h-36 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                                            <h3 className="text-3xl font-extrabold text-slate-900">{stats?.total_records || 0}</h3>
                                            <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase mt-0.5">Total</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between pt-4">
                                    <div>
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-blue-700"></div> {top1[0]}
                                        </div>
                                        <h4 className="text-xl font-extrabold text-slate-900">{pct1}%</h4>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-1">
                                            <div className="w-2 h-2 rounded-full bg-slate-200"></div> {top2[0]}
                                        </div>
                                        <h4 className="text-xl font-extrabold text-slate-900">{pct2}%</h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Monthly Patient Growth */}
                        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 mb-8 overflow-hidden">
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">Monthly Patient Growth</h3>
                                    <p className="text-[13px] font-medium text-slate-500 mt-1">Acquisition vs Retention</p>
                                </div>
                                <button className="flex items-center gap-1 text-[13px] font-bold text-blue-600 hover:text-blue-800 transition-colors">
                                    View Details <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="h-[140px] flex items-end justify-between gap-2 mt-4">
                                {[20, 35, 30, 45, 35, 50, 60, 40, 50, 35, 30, 60].map((val, i) => (
                                    <div key={i} className="w-full bg-[#A3C0E8] rounded-t-full transition-all hover:bg-blue-500" style={{ height: `${val}%` }}></div>
                                ))}
                            </div>
                        </div>

                        {/* Export Data */}
                        <div className="bg-[#EEF2F6] rounded-[2rem] p-8 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="max-w-md">
                                <h3 className="text-xl font-bold text-slate-900">Export Data</h3>
                                <p className="text-[14px] font-medium text-slate-600 mt-2 leading-relaxed">
                                    Generate a comprehensive CSV or PDF report of current analytics.
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-4 rounded-2xl font-bold text-[14px] shadow-sm flex items-center gap-2 transition-all active:scale-95 border border-slate-200">
                                    <FileText className="w-5 h-5 text-slate-400" /> PDF Export
                                </button>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-bold text-[14px] shadow-md flex items-center gap-2 transition-all active:scale-95">
                                    <Download className="w-5 h-5" /> Download Report
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
