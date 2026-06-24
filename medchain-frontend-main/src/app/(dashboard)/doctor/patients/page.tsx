'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, FileUp, History, ChevronRight, Loader2, Users } from 'lucide-react';
import { accessApi, AccessGrantModel } from '@/lib/api/access';
import { appointmentsApi, Appointment } from '@/lib/api/appointments';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PatientEntry {
    id: string;
    initials: string;
    name: string;
    email: string;
    source: 'grant' | 'appointment';
    lastVisit?: string;
    specialty?: string;
}

function getPatientName(apt: Appointment) {
    if (apt.patient_first_name || apt.patient_last_name) {
        return `${apt.patient_first_name || ''} ${apt.patient_last_name || ''}`.trim();
    }
    return apt.patient_email || 'Anonymous Patient';
}

export default function DoctorPatientsPage() {
    const router = useRouter();
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [grants, setGrants] = useState<AccessGrantModel[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [grantData, aptData] = await Promise.all([
                    accessApi.getGrants(),
                    appointmentsApi.getDoctorSchedule(),
                ]);
                setGrants(grantData);
                setAppointments(aptData);
                // Auto-select first patient
                if (grantData.length > 0) {
                    setSelectedPatientId(grantData[0].patient);
                } else if (aptData.length > 0 && aptData[0].patient_id) {
                    setSelectedPatientId(aptData[0].patient_id);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    // Merge grant patients + appointment patients (deduplicated by patient ID)
    const allPatients = useMemo<PatientEntry[]>(() => {
        const map = new Map<string, PatientEntry>();

        // Add patients from access grants
        for (const g of grants) {
            const name = `${g.patient_details?.first_name || ''} ${g.patient_details?.last_name || ''}`.trim() || g.patient_details?.email || 'Unknown';
            const email = g.patient_details?.email || '';
            map.set(g.patient, {
                id: g.patient,
                initials: (name[0] || 'U').toUpperCase(),
                name,
                email,
                source: 'grant',
                lastVisit: new Date(g.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            });
        }

        // Add patients from appointments (those not already in map)
        for (const apt of appointments) {
            if (!apt.patient_id) continue;
            if (!map.has(apt.patient_id)) {
                const name = getPatientName(apt);
                map.set(apt.patient_id, {
                    id: apt.patient_id,
                    initials: (name[0] || 'P').toUpperCase(),
                    name,
                    email: apt.patient_email || '',
                    source: 'appointment',
                    specialty: apt.specialty,
                    lastVisit: new Date(apt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                });
            }
        }

        return Array.from(map.values());
    }, [grants, appointments]);

    const filteredPatients = useMemo(() =>
        allPatients.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase())
        ), [allPatients, searchTerm]);

    const selectedData = filteredPatients.find(p => p.id === selectedPatientId) || filteredPatients[0];

    // Get appointment history for the selected patient
    const patientAppointments = useMemo(() =>
        appointments.filter(a => a.patient_id === selectedData?.id).slice(0, 3),
        [appointments, selectedData]);

    return (
        <div className="min-h-full bg-[#F8FAFC] pb-16 flex justify-center">
            <div className="flex-1 max-w-[1200px] w-full p-8 animate-in fade-in duration-500">

                <div className="flex flex-col lg:flex-row gap-10">

                    {/* Left Column: Patients List */}
                    <div className="flex-1 max-w-[650px]">
                        <div className="mb-8">
                            <h2 className="text-[2.25rem] font-extrabold tracking-tight text-slate-900">Patients</h2>
                            <p className="text-slate-500 font-medium mt-1 text-[15px] max-w-xs leading-relaxed">
                                {isLoading ? 'Loading...' : `${allPatients.length} patient${allPatients.length !== 1 ? 's' : ''} in your network`}
                            </p>
                        </div>

                        <div className="flex gap-4 mb-8">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Search patients..."
                                    className="w-full bg-white border border-slate-200 rounded-full pl-11 pr-4 py-3 text-[14px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm"
                                />
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
                                <p className="font-bold">Loading patients...</p>
                            </div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-slate-100 shadow-sm text-center px-8">
                                <Users className="w-12 h-12 text-slate-300 mb-4" />
                                <h3 className="text-lg font-bold text-slate-700">No patients yet</h3>
                                <p className="text-slate-500 text-sm mt-2 max-w-xs">
                                    Patients will appear here once they book an appointment with you or grant you access to their records.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredPatients.map(patient => {
                                    const isSelected = selectedPatientId === patient.id || selectedData?.id === patient.id;
                                    return (
                                        <div
                                            key={patient.id}
                                            onClick={() => setSelectedPatientId(patient.id)}
                                            className={`p-4 rounded-[2rem] flex items-center justify-between cursor-pointer transition-all border ${isSelected ? 'bg-white border-emerald-600 ring-1 ring-emerald-600 shadow-md' : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-[15px] shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                    {patient.initials}
                                                </div>
                                                <div>
                                                    <h4 className={`font-bold text-[15px] ${isSelected ? 'text-emerald-600' : 'text-slate-900'}`}>{patient.name}</h4>
                                                    <p className="text-[12px] text-slate-500 mt-0.5">{patient.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-6">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                        {patient.source === 'grant' ? 'Access Granted' : 'Via Appointment'}
                                                    </p>
                                                    <p className="font-bold text-slate-700 text-[13px] mt-0.5">{patient.lastVisit}</p>
                                                </div>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    <ChevronRight className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Patient Details */}
                    {selectedData ? (
                        <div className="flex-1 max-w-[400px]">
                            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-[100px] -z-0" />

                                <div className="relative z-10 flex flex-col items-center pt-4">
                                    <div className="w-24 h-24 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-emerald-600/20 mb-5 transform rotate-3 hover:rotate-0 transition-transform">
                                        {selectedData.initials}
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-slate-900 text-center">{selectedData.name}</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-1">{selectedData.email}</p>

                                    <div className="w-full mt-6">
                                        <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold ${
                                            selectedData.source === 'grant'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            {selectedData.source === 'grant' ? 'Access Granted' : 'Appointment Patient'}
                                        </span>
                                    </div>

                                    {/* Recent Appointments */}
                                    {patientAppointments.length > 0 && (
                                        <div className="w-full mt-8">
                                            <h4 className="text-xs font-extrabold tracking-wider text-slate-500 uppercase mb-4">Recent Appointments</h4>
                                            <div className="space-y-3">
                                                {patientAppointments.map(apt => (
                                                    <div key={apt.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="text-[13px] font-bold text-slate-900">{apt.specialty || 'General'}</p>
                                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                                    {new Date(apt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {apt.appointment_time.slice(0, 5)}
                                                                </p>
                                                            </div>
                                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                                                apt.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                                                apt.status === 'Pending' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                                {apt.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full mt-8 space-y-3">
                                        {selectedData.source === 'grant' ? (
                                            <Link
                                                href={`/doctor/records?patientId=${selectedData.id}&patientName=${encodeURIComponent(selectedData.name)}`}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <History className="w-5 h-5" /> View Medical History
                                            </Link>
                                        ) : (
                                            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-3 rounded-2xl text-center">
                                                Patient hasn't granted access to records yet.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-8 right-8 h-1 bg-emerald-600 rounded-t-full" />
                            </div>
                        </div>
                    ) : !isLoading && (
                        <div className="flex-1 max-w-[400px] flex items-center justify-center">
                            <div className="text-center p-8 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                                <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <p className="text-slate-500 font-bold">Select a patient to view details</p>
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}
