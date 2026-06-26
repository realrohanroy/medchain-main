'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, FileUp, History, ChevronRight, Loader2, Users } from 'lucide-react';
import { accessApi, AccessGrantModel } from '@/lib/api/access';
import { appointmentsApi, Appointment } from '@/lib/api/appointments';
import { ragApi, SourceChunk } from '@/lib/api/rag';
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
    care_relationship?: string;
    scope?: string;
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

    // Modal States
    const [isSynthesizeModalOpen, setIsSynthesizeModalOpen] = useState(false);
    const [synthesizeLoading, setSynthesizeLoading] = useState(false);
    const [synthesizeResult, setSynthesizeResult] = useState<{ answer: string; sources: SourceChunk[] } | null>(null);

    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [manifestRecords, setManifestRecords] = useState<any[]>([]);
    const [manifestLoading, setManifestLoading] = useState(false);
    const [requestScope, setRequestScope] = useState<'FULL' | 'SELECTED'>('FULL');
    const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
    const [requestReason, setRequestReason] = useState('');
    const [requestSubmitting, setRequestSubmitting] = useState(false);

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
                if (grantData.length > 0 && grantData[0].patient_details) {
                    setSelectedPatientId(grantData[0].patient_details.id);
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
            const patientId = g.patient_details?.id || g.id; // fallback
            const name = `${g.patient_details?.first_name || ''} ${g.patient_details?.last_name || ''}`.trim() || g.patient_details?.email || 'Unknown';
            const email = g.patient_details?.email || '';
            map.set(patientId, {
                id: patientId,
                initials: (name[0] || 'U').toUpperCase(),
                name,
                email,
                source: 'grant',
                lastVisit: new Date(g.granted_at || g.created_at || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                care_relationship: g.care_relationship,
                scope: g.scope,
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

    const handleSynthesize = async () => {
        if (!selectedData?.id) return;
        setIsSynthesizeModalOpen(true);
        setSynthesizeLoading(true);
        setSynthesizeResult(null);
        try {
            const res = await ragApi.synthesize({ patient_id: selectedData.id });
            setSynthesizeResult(res);
        } catch (err) {
            console.error('Synthesize error:', err);
            setSynthesizeResult({ answer: 'Failed to generate summary.', sources: [] });
        } finally {
            setSynthesizeLoading(false);
        }
    };

    const handleOpenRequestModal = async () => {
        if (!selectedData?.care_relationship) return;
        setIsRequestModalOpen(true);
        setManifestLoading(true);
        setManifestRecords([]);
        setSelectedRecordIds(new Set());
        setRequestReason('');
        setRequestScope('FULL');
        try {
            const records = await accessApi.getManifest(selectedData.care_relationship);
            setManifestRecords(records);
        } catch (err) {
            console.error('Manifest error:', err);
        } finally {
            setManifestLoading(false);
        }
    };

    const handleSubmitRequest = async () => {
        if (!selectedData?.care_relationship) return;
        setRequestSubmitting(true);
        try {
            await accessApi.createRequest({
                care_relationship: selectedData.care_relationship,
                requested_scope: requestScope,
                reason: requestReason,
                requested_records: requestScope === 'SELECTED' ? Array.from(selectedRecordIds) : [],
            });
            alert('Request submitted successfully!');
            setIsRequestModalOpen(false);
        } catch (err) {
            console.error('Request error:', err);
            alert('Failed to submit request.');
        } finally {
            setRequestSubmitting(false);
        }
    };

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

                                    <div className="w-full mt-8 flex flex-col gap-3">
                                        {selectedData.source === 'grant' && selectedData.scope && selectedData.scope !== 'NONE' ? (
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
                                        
                                        {/* Generate Summary Button */}
                                        {selectedData.source === 'grant' && (selectedData.scope === 'FULL' || selectedData.scope === 'SELECTED') && (
                                            <button
                                                onClick={handleSynthesize}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                                            >
                                                <FileUp className="w-5 h-5" /> Generate Summary
                                            </button>
                                        )}
                                        
                                        {/* Request Access Button */}
                                        {!!selectedData.care_relationship && selectedData.scope !== 'FULL' && (
                                            <button
                                                onClick={handleOpenRequestModal}
                                                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                                            >
                                                <UserPlus className="w-5 h-5" /> Request Access
                                            </button>
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

            {/* Synthesize Modal */}
            {isSynthesizeModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsSynthesizeModalOpen(false)}>
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Patient Summary: {selectedData?.name}</h3>
                            <button onClick={() => setIsSynthesizeModalOpen(false)} className="text-slate-400 hover:text-slate-900 font-bold">Close</button>
                        </div>
                        {synthesizeLoading ? (
                            <div className="flex flex-col items-center py-10 gap-4">
                                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                <p className="text-slate-500 font-medium">Generating chronological summary...</p>
                            </div>
                        ) : synthesizeResult ? (
                            <div className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                                    {synthesizeResult.answer}
                                </div>
                                {synthesizeResult.sources && synthesizeResult.sources.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-900 mb-3">Cited Sources</h4>
                                        <div className="space-y-2">
                                            {synthesizeResult.sources.map((s, idx) => (
                                                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
                                                    <span className="font-bold uppercase tracking-wider text-[10px] text-blue-600 mb-1 block">{s.source_type}</span>
                                                    <span className="line-clamp-2">{s.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* Request Access Modal */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsRequestModalOpen(false)}>
                    <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full p-8 max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <h3 className="text-xl font-bold text-slate-900">Request Access</h3>
                            <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-900 font-bold">Close</button>
                        </div>

                        <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-2">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Request Scope</label>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button
                                        onClick={() => setRequestScope('FULL')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${requestScope === 'FULL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        Full Access
                                    </button>
                                    <button
                                        onClick={() => setRequestScope('SELECTED')}
                                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${requestScope === 'SELECTED' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        Selected Records
                                    </button>
                                </div>
                            </div>

                            {requestScope === 'SELECTED' && (
                                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 flex-1 overflow-y-auto">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Available Records</h4>
                                    {manifestLoading ? (
                                        <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading manifest...</div>
                                    ) : manifestRecords.length === 0 ? (
                                        <p className="text-sm text-slate-500">No records available for this patient.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {manifestRecords.map(record => (
                                                <label key={record.id} className="flex items-start gap-3 p-2 hover:bg-white rounded-lg cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1"
                                                        checked={selectedRecordIds.has(record.id)}
                                                        onChange={(e) => {
                                                            const newSet = new Set(selectedRecordIds);
                                                            if (e.target.checked) newSet.add(record.id);
                                                            else newSet.delete(record.id);
                                                            setSelectedRecordIds(newSet);
                                                        }}
                                                    />
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900">{record.record_type}</div>
                                                        <div className="text-xs text-slate-500">{record.record_date} • {record.doctor_name}</div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Reason (Optional)</label>
                                <textarea
                                    value={requestReason}
                                    onChange={e => setRequestReason(e.target.value)}
                                    placeholder="Briefly explain why you need access..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-20"
                                />
                            </div>
                        </div>

                        <div className="mt-6 shrink-0">
                            <button
                                onClick={handleSubmitRequest}
                                disabled={requestSubmitting || (requestScope === 'SELECTED' && selectedRecordIds.size === 0)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors"
                            >
                                {requestSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
