'use client';

import {
    Search, Bell, Settings, User, BadgeCheck, FileText, Users, Activity,
    HeartPulse, Link2, ShieldAlert, ArrowUpRight, ArrowRight, ShieldCheck,
    Mail, Phone, MapPin, UploadCloud, CalendarDays, FolderOpen, CalendarCheck, FileClock, ChevronRight, ActivitySquare, LogIn, HardDriveUpload
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function PatientDashboard() {
    const router = useRouter();
    return (
        <div className="min-h-full bg-slate-50/50 pb-16">
            <div className="flex-1 space-y-10 p-8 max-w-[1100px] animate-in fade-in duration-500 mt-2">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-[2rem] font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            Good Morning, Patient 👋
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

                {/* Action Cards (Row 1) */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Upload Card */}
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

                    {/* Book Appointment Card */}
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

                {/* Stats Row (Row 2) */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card onClick={() => router.push('/records')} className="border-0 shadow-sm rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex items-center group">
                        <CardContent className="p-6 flex items-center justify-center gap-5 w-full">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100 group-hover:border-blue-200 transition-colors">
                                <FolderOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[11px] font-extrabold text-slate-500 tracking-widest mb-1">TOTAL RECORDS</p>
                                <h4 className="text-[1.75rem] font-extrabold text-slate-900 leading-none">24</h4>
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
                                <h4 className="text-[1.75rem] font-extrabold text-slate-900 leading-none">02</h4>
                            </div>
                        </CardContent>
                    </Card>
                    <Card onClick={() => router.push('/appointments')} className="border-0 shadow-sm rounded-[1.5rem] bg-slate-50 hover:bg-slate-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex items-center group">
                        <CardContent className="p-6 flex items-center justify-center gap-5 w-full">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100 group-hover:border-blue-200 transition-colors">
                                <FileClock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex flex-col">
                                <p className="text-[11px] font-extrabold text-slate-500 tracking-widest mb-1">PENDING REQUESTS</p>
                                <h4 className="text-[1.75rem] font-extrabold text-slate-900 leading-none">05</h4>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Section (Row 3) */}
                <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr] items-start pt-2">
                    {/* Left Column: Upcoming Appts + Stats overview */}
                    <div className="space-y-10">
                        {/* Upcoming Appointments */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-slate-900">Upcoming Appointments</h3>
                                <a href="#" onClick={(e) => { e.preventDefault(); router.push('/appointments'); }} className="text-[13px] font-bold text-blue-600 hover:text-blue-800 active:scale-95 transition-all text-center">View all</a>
                            </div>
                            <div className="space-y-4">
                                {/* Appt 1 */}
                                <Card className="border border-slate-100/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-0.5 transition-all rounded-[1.5rem] bg-white cursor-pointer group">
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                                <img src="https://i.pravatar.cc/150?img=47" alt="Dr. Harpreet Singh" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="text-[15px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Dr. Harpreet Singh</h4>
                                                <p className="text-[13px] font-medium text-slate-500 mt-0.5">Cardiologist • City Heart Center</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5 shrink-0">
                                            <div className="text-right">
                                                <div className="text-[14px] font-bold text-slate-900">Oct 24, 2023</div>
                                                <div className="text-[12px] font-medium text-slate-500 mt-0.5">10:30 AM</div>
                                            </div>
                                            <button className="px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white active:scale-95 transition-all text-[11px] font-bold rounded-full">Confirmed</button>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Appt 2 */}
                                <Card className="border border-slate-100/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-0.5 transition-all rounded-[1.5rem] bg-white cursor-pointer group">
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                                                <img src="https://i.pravatar.cc/150?img=11" alt="Dr. S. Subramaniam" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h4 className="text-[15px] font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Dr. S. Subramaniam</h4>
                                                <p className="text-[13px] font-medium text-slate-500 mt-0.5">General Physician • Health First Clinic</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5 shrink-0">
                                            <div className="text-right">
                                                <div className="text-[14px] font-bold text-slate-900">Oct 28, 2023</div>
                                                <div className="text-[12px] font-medium text-slate-500 mt-0.5">02:15 PM</div>
                                            </div>
                                            <button className="px-3.5 py-1.5 bg-orange-50/80 text-orange-600 hover:bg-orange-600 hover:text-white active:scale-95 transition-all text-[11px] font-bold rounded-full">Pending</button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Health Status Overview */}
                        <Card className="border border-slate-100/50 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow rounded-[1.5rem] bg-gradient-to-br from-orange-50/20 to-orange-50/40 cursor-pointer group">
                            <CardContent className="p-7">
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Health Status Overview</h3>
                                        <p className="text-[13px] text-slate-500 font-medium mt-1">Last vitals measured 2 days ago</p>
                                    </div>
                                    <div className="text-orange-600/80 group-hover:scale-110 transition-transform">
                                        <ActivitySquare className="w-6 h-6" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-100/50 hover:-translate-y-1 hover:shadow-md transition-all">
                                        <span className="text-[10px] font-extrabold text-slate-400 tracking-widest mb-3 block">HEART RATE</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-extrabold text-slate-900">72</span>
                                            <span className="text-xs font-bold text-slate-400">bpm</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 shadow-sm border border-slate-100/50 hover:-translate-y-1 hover:shadow-md transition-all">
                                        <span className="text-[10px] font-extrabold text-slate-400 tracking-widest mb-3 block">BP</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-extrabold text-slate-900">120/80</span>
                                            <span className="text-xs font-bold text-slate-400">mmHg</span>
                                        </div>
                                    </div>
                                    <div className="bg-orange-50 rounded-2xl p-5 shadow-sm border border-orange-100/50 hover:-translate-y-1 hover:shadow-md transition-all">
                                        <span className="text-[10px] font-extrabold text-orange-600/80 tracking-widest mb-3 block">SPO2</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-extrabold text-orange-600">98</span>
                                            <span className="text-xs font-bold text-orange-400">%</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Recent Activity */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-slate-900">Recent Activity</h3>
                        <div className="relative pl-6 lg:pl-8 space-y-10 before:absolute before:inset-0 before:left-3.5 before:h-full before:w-[2px] before:bg-slate-100">

                            {/* Item 1 */}
                            <div className="relative flex items-start gap-5 group cursor-pointer">
                                <div className="absolute top-0 left-[-1.9rem] w-8 h-8 rounded-full bg-blue-50/80 ring-4 ring-white flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                                    <FileText className="w-3.5 h-3.5" />
                                </div>
                                <div className="pt-0.5 group-hover:translate-x-1 transition-transform">
                                    <p className="text-[12px] font-bold text-slate-500 mb-1">Today, 09:15 AM</p>
                                    <h4 className="text-[14px] font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">Record uploaded</h4>
                                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                        MRI Scan - Lumbar Spine has been encrypted and saved to your vault.
                                    </p>
                                </div>
                            </div>

                            {/* Item 2 */}
                            <div className="relative flex items-start gap-5 group cursor-pointer">
                                <div className="absolute top-0 left-[-1.9rem] w-8 h-8 rounded-full bg-green-50 ring-4 ring-white flex items-center justify-center text-green-600 shrink-0 group-hover:scale-110 transition-transform">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div className="pt-0.5 group-hover:translate-x-1 transition-transform">
                                    <p className="text-[12px] font-bold text-slate-500 mb-1">Yesterday</p>
                                    <h4 className="text-[14px] font-bold text-slate-900 mb-1.5 group-hover:text-green-600 transition-colors">Request approved</h4>
                                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                        St. Mary's Hospital successfully accessed your vaccination records.
                                    </p>
                                </div>
                            </div>

                            {/* Item 3 */}
                            <div className="relative flex items-start gap-5 group cursor-pointer">
                                <div className="absolute top-0 left-[-1.9rem] w-8 h-8 rounded-full bg-blue-50/80 ring-4 ring-white flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-110 transition-transform">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                </div>
                                <div className="pt-0.5 group-hover:translate-x-1 transition-transform">
                                    <p className="text-[12px] font-bold text-slate-500 mb-1">Oct 20, 2023</p>
                                    <h4 className="text-[14px] font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">Appointment booked</h4>
                                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                        Your session with Dr. Harpreet Singh is confirmed for Oct 24.
                                    </p>
                                </div>
                            </div>

                            {/* Item 4 */}
                            <div className="relative flex items-start gap-5 group cursor-pointer">
                                <div className="absolute top-0 left-[-1.9rem] w-8 h-8 rounded-full border border-slate-200 bg-white ring-4 ring-white flex items-center justify-center text-slate-400 shrink-0 group-hover:scale-110 transition-transform">
                                    <LogIn className="w-3.5 h-3.5 ml-0.5" />
                                </div>
                                <div className="pt-0.5 group-hover:translate-x-1 transition-transform">
                                    <p className="text-[12px] font-bold text-slate-500 mb-1">Oct 19, 2023</p>
                                    <h4 className="text-[14px] font-bold text-slate-900 mb-1.5 group-hover:text-slate-600 transition-colors">New login detected</h4>
                                    <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
                                        A new device signed in from San Jose, CA.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

            </div>
        </div>
    )
}
