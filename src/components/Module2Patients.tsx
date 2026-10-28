import React, { useState, useMemo } from 'react';
import { Patient, VisitRecord, TriageLevel, PatientStatus } from '../types/hospital';
import { DOCTORS_ROSTER } from '../data/mockHospitalData';
import {
  Users,
  Search,
  Plus,
  Filter,
  Calendar,
  Phone,
  AlertTriangle,
  FileText,
  Clock,
  Heart,
  Activity,
  CheckCircle2,
  X,
  Stethoscope,
  Shield,
  ArrowRight
} from 'lucide-react';

interface Module2PatientsProps {
  patients: Patient[];
  onSavePatient: (patient: Patient) => void;
  onRecordSubsequentVisit: (patientId: string, newVisit: VisitRecord) => void;
  isIntakeModalOpen: boolean;
  setIsIntakeModalOpen: (open: boolean) => void;
  initialSelectedPatientId?: string | null;
}

export const Module2Patients: React.FC<Module2PatientsProps> = ({
  patients,
  onSavePatient,
  onRecordSubsequentVisit,
  isIntakeModalOpen,
  setIsIntakeModalOpen,
  initialSelectedPatientId,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [visitTypeFilter, setVisitTypeFilter] = useState<'all' | 'first-time' | 'returning'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  // Selected patient for full dossier modal
  const [selectedPatientForView, setSelectedPatientForView] = useState<Patient | null>(() => {
    if (initialSelectedPatientId) {
      return patients.find((p) => p.id === initialSelectedPatientId) || null;
    }
    return null;
  });

  // Intake Form State: "first-time" vs "returning"
  const [intakeMode, setIntakeMode] = useState<'first-time' | 'returning'>('first-time');

  // Form Fields for First-Time Patient
  const [firstTimeForm, setFirstTimeForm] = useState({
    fullName: '',
    dob: '1985-05-15',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    email: '',
    nationalId: `NHI-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
    address: '',
    bloodGroup: 'O+' as Patient['bloodGroup'],
    allergies: '',
    chronicConditions: '',
    emergencyName: '',
    emergencyRel: 'Spouse',
    emergencyPhone: '',
    // Visit details
    department: 'General Medicine',
    attendingDoctor: 'Dr. Kevin O\'Connor',
    chiefComplaint: '',
    bp: '120/80',
    hr: 75,
    spo2: 98,
    temp: 98.6,
    weight: 70,
    triageLevel: 'Routine' as TriageLevel,
    diagnosis: '',
    prescription: '',
    clinicalNotes: '',
  });

  // Form Fields for Returning Patient (Second time or more)
  const [returningSearch, setReturningSearch] = useState('');
  const [selectedReturningPatient, setSelectedReturningPatient] = useState<Patient | null>(null);
  const [returningForm, setReturningForm] = useState({
    department: 'Cardiology',
    attendingDoctor: 'Dr. Marcus Vance',
    chiefComplaint: '',
    bp: '125/82',
    hr: 78,
    spo2: 98,
    temp: 98.6,
    weight: 72,
    triageLevel: 'Routine' as TriageLevel,
    diagnosis: '',
    prescription: '',
    clinicalNotes: '',
    status: 'Under Care' as PatientStatus,
  });

  // Filtered patients list
  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.nationalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery) ||
        patient.visits.some((v) => v.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        visitTypeFilter === 'all'
          ? true
          : visitTypeFilter === 'first-time'
          ? patient.visitCount === 1
          : patient.visitCount >= 2;

      const matchesDept =
        deptFilter === 'all'
          ? true
          : patient.visits[patient.visits.length - 1]?.department === deptFilter;

      return matchesSearch && matchesType && matchesDept;
    });
  }, [patients, searchQuery, visitTypeFilter, deptFilter]);

  // Handle First-Time Patient Submission
  const handleFirstTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstTimeForm.fullName || !firstTimeForm.phone) {
      alert('Please fill in the patient name and contact phone number.');
      return;
    }

    const newId = `PT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const birthYear = new Date(firstTimeForm.dob).getFullYear();
    const age = new Date().getFullYear() - birthYear;

    const initialVisit: VisitRecord = {
      visitId: `VST-${Date.now().toString().slice(-6)}`,
      visitNumber: 1,
      isFirstVisit: true,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      department: firstTimeForm.department,
      attendingDoctor: firstTimeForm.attendingDoctor,
      chiefComplaint: firstTimeForm.chiefComplaint || 'First-time general consultation',
      vitals: {
        bloodPressure: firstTimeForm.bp || '120/80',
        heartRate: Number(firstTimeForm.hr) || 75,
        spo2: Number(firstTimeForm.spo2) || 98,
        temperature: Number(firstTimeForm.temp) || 98.6,
        weight: Number(firstTimeForm.weight) || 70,
      },
      triageLevel: firstTimeForm.triageLevel,
      diagnosis: firstTimeForm.diagnosis || 'Initial assessment in progress',
      prescription: firstTimeForm.prescription
        ? firstTimeForm.prescription.split(',').map((s) => s.trim())
        : [],
      clinicalNotes: firstTimeForm.clinicalNotes || 'First-time hospital admission and baseline registration.',
      status: 'Checked In',
    };

    const newPatient: Patient = {
      id: newId,
      nationalId: firstTimeForm.nationalId,
      fullName: firstTimeForm.fullName,
      age: Math.max(age, 1),
      dob: firstTimeForm.dob,
      gender: firstTimeForm.gender,
      phone: firstTimeForm.phone,
      email: firstTimeForm.email || `${firstTimeForm.fullName.toLowerCase().replace(/\s+/g, '.')}@patient.com`,
      address: firstTimeForm.address || 'Metro City Residential Area',
      bloodGroup: firstTimeForm.bloodGroup,
      allergies: firstTimeForm.allergies
        ? firstTimeForm.allergies.split(',').map((s) => s.trim())
        : [],
      chronicConditions: firstTimeForm.chronicConditions
        ? firstTimeForm.chronicConditions.split(',').map((s) => s.trim())
        : [],
      emergencyContact: {
        name: firstTimeForm.emergencyName || 'Family Contact',
        relationship: firstTimeForm.emergencyRel,
        phone: firstTimeForm.emergencyPhone || firstTimeForm.phone,
      },
      registrationDate: new Date().toISOString().split('T')[0],
      visitCount: 1, // 1st visit
      visits: [initialVisit],
    };

    onSavePatient(newPatient);
    setIsIntakeModalOpen(false);
    setSelectedPatientForView(newPatient);
  };

  // Handle Returning Patient (Second Visit+) Submission
  const handleReturningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturningPatient) {
      alert('Please search and select an existing patient first.');
      return;
    }

    const nextVisitNumber = selectedReturningPatient.visitCount + 1;
    const newVisit: VisitRecord = {
      visitId: `VST-${Date.now().toString().slice(-6)}`,
      visitNumber: nextVisitNumber,
      isFirstVisit: false,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      department: returningForm.department,
      attendingDoctor: returningForm.attendingDoctor,
      chiefComplaint: returningForm.chiefComplaint || `Returning visit #${nextVisitNumber}`,
      vitals: {
        bloodPressure: returningForm.bp || '120/80',
        heartRate: Number(returningForm.hr) || 75,
        spo2: Number(returningForm.spo2) || 98,
        temperature: Number(returningForm.temp) || 98.6,
        weight: Number(returningForm.weight) || 70,
      },
      triageLevel: returningForm.triageLevel,
      diagnosis: returningForm.diagnosis || 'Follow-up clinical assessment',
      prescription: returningForm.prescription
        ? returningForm.prescription.split(',').map((s) => s.trim())
        : [],
      clinicalNotes: returningForm.clinicalNotes || `Patient returned for visit #${nextVisitNumber}. Evaluated current progression.`,
      status: returningForm.status,
    };

    onRecordSubsequentVisit(selectedReturningPatient.id, newVisit);
    setIsIntakeModalOpen(false);

    // Update viewing patient
    const updated = {
      ...selectedReturningPatient,
      visitCount: nextVisitNumber,
      visits: [...selectedReturningPatient.visits, newVisit],
    };
    setSelectedPatientForView(updated);
  };

  // Quick select returning patient from search list
  const returningSearchResults = useMemo(() => {
    if (!returningSearch.trim()) return [];
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(returningSearch.toLowerCase()) ||
        p.id.toLowerCase().includes(returningSearch.toLowerCase()) ||
        p.phone.includes(returningSearch)
    );
  }, [patients, returningSearch]);

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">
            <span>Module 02</span>
            <span aria-hidden="true">·</span>
            <span>Clinical Records & Visit Lifecycle</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Patient Registry & Intake Management
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Complete database of hospital patients. Full onboarding intake for first-time visitors vs. accelerated check-in with baseline history retrieval for returning patients (visit #2 and beyond).
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIntakeMode('first-time');
              setIsIntakeModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Patient Intake</span>
          </button>
        </div>
      </div>

      {/* Database Filters & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total in DB */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Total in Database</span>
            <p className="text-2xl font-bold text-white tabular-nums mt-0.5">{patients.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* First-time visits */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">First-Time Visitors (1st Visit)</span>
            <p className="text-2xl font-bold text-cyan-400 tabular-nums mt-0.5">
              {patients.filter((p) => p.visitCount === 1).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Returning visits */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Returning Patients (2nd+ Visit)</span>
            <p className="text-2xl font-bold text-amber-400 tabular-nums mt-0.5">
              {patients.filter((p) => p.visitCount >= 2).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Critical / Urgent Priority */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Under Urgent/Emergency Care</span>
            <p className="text-2xl font-bold text-rose-400 tabular-nums mt-0.5">
              {
                patients.filter((p) => {
                  const lastVisit = p.visits[p.visits.length - 1];
                  return lastVisit?.triageLevel === 'Emergency' || lastVisit?.triageLevel === 'Urgent';
                }).length
              }
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search patient by name, ID (e.g. PT-2026-0104), phone, diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Segmented Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Visit Type Filter */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setVisitTypeFilter('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                visitTypeFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Visits
            </button>
            <button
              onClick={() => setVisitTypeFilter('first-time')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                visitTypeFilter === 'first-time'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1st Time Only
            </button>
            <button
              onClick={() => setVisitTypeFilter('returning')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                visitTypeFilter === 'returning'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Returning (2nd+)
            </button>
          </div>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="Cardiology">Cardiology</option>
            <option value="Pulmonology">Pulmonology</option>
            <option value="Neurology">Neurology</option>
            <option value="Nephrology">Nephrology</option>
            <option value="Orthopedics">Orthopedics</option>
            <option value="Gastroenterology">Gastroenterology</option>
            <option value="General Medicine">General Medicine</option>
          </select>
        </div>
      </div>

      {/* Patients Data Grid Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">Patient ID</th>
                <th className="py-3 px-4">Patient Name & Demographics</th>
                <th className="py-3 px-4">Visit Lifecycle</th>
                <th className="py-3 px-4">Blood Group</th>
                <th className="py-3 px-4">Latest Diagnosis / Reason</th>
                <th className="py-3 px-4">Doctor & Dept</th>
                <th className="py-3 px-4">Status / Triage</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-base font-semibold text-slate-300">No patient records found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or register a new patient.</p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const latestVisit = patient.visits[patient.visits.length - 1];
                  const isFirstTime = patient.visitCount === 1;

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedPatientForView(patient)}
                    >
                      {/* Patient ID */}
                      <td className="py-3 px-4 font-mono font-medium text-emerald-400 whitespace-nowrap">
                        {patient.id}
                      </td>

                      {/* Name & Demographics */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                          {patient.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{patient.age} yrs</span>
                          <span aria-hidden="true">·</span>
                          <span>{patient.gender}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{patient.phone}</span>
                        </div>
                      </td>

                      {/* Visit Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isFirstTime ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                            <span>1st-Time Visit</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                            <span>Returning ({patient.visitCount} visits)</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                          Last: {latestVisit?.date || patient.registrationDate}
                        </div>
                      </td>

                      {/* Blood Group & Allergies */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {patient.bloodGroup}
                        </span>
                        {patient.allergies.length > 0 && (
                          <div className="text-[10px] text-rose-400 mt-1 max-w-[120px] truncate" title={patient.allergies.join(', ')}>
                            Allergic: {patient.allergies.join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Latest Diagnosis */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-slate-200 truncate" title={latestVisit?.diagnosis}>
                          {latestVisit?.diagnosis || 'Initial assessment in progress'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          "{latestVisit?.chiefComplaint}"
                        </div>
                      </td>

                      {/* Doctor & Dept */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-300">
                          {latestVisit?.attendingDoctor || 'Primary Physician'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {latestVisit?.department}
                        </div>
                      </td>

                      {/* Status & Triage */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold text-center ${
                              latestVisit?.triageLevel === 'Emergency'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : latestVisit?.triageLevel === 'Urgent'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {latestVisit?.triageLevel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono text-center">
                            {latestVisit?.status || 'Active'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPatientForView(patient);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Intake Workflow Modal (First-Time vs Returning Visit) */}
      {isIntakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-400" />
                  <span>Hospital Patient Intake & Check-In</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Distinguishes between first-time baseline registration and second-time+ returning check-ins.
                </p>
              </div>
              <button
                onClick={() => setIsIntakeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 p-2 bg-slate-950 border-b border-slate-800 gap-2">
              <button
                type="button"
                onClick={() => setIntakeMode('first-time')}
                className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  intakeMode === 'first-time'
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>1. First-Time Visit (New Patient)</span>
              </button>

              <button
                type="button"
                onClick={() => setIntakeMode('returning')}
                className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  intakeMode === 'returning'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>2. Returning Patient (Second Time+)</span>
              </button>
            </div>

            {/* Modal Body Scrollable */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {intakeMode === 'first-time' ? (
                /* ----------------- FIRST-TIME FORM ----------------- */
                <form onSubmit={handleFirstTimeSubmit} className="space-y-6">
                  <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs text-cyan-300">
                    <strong>First-Time Patient Protocol:</strong> Comprehensive intake of personal demographics, national ID, emergency contact, blood group, allergies, chronic conditions, and initial vital baseline.
                  </div>

                  {/* Section 1: Demographics */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                      1. Patient Personal Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={firstTimeForm.fullName}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, fullName: e.target.value })}
                          placeholder="e.g. Jonathan Wayne"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Date of Birth *
                        </label>
                        <input
                          type="date"
                          required
                          value={firstTimeForm.dob}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, dob: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
                        <select
                          value={firstTimeForm.gender}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, gender: e.target.value as any })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={firstTimeForm.phone}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Blood Group *
                        </label>
                        <select
                          value={firstTimeForm.bloodGroup}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, bloodGroup: e.target.value as any })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                        >
                          <option value="O+">O+ (Positive)</option>
                          <option value="O-">O- (Negative)</option>
                          <option value="A+">A+ (Positive)</option>
                          <option value="A-">A- (Negative)</option>
                          <option value="B+">B+ (Positive)</option>
                          <option value="B-">B- (Negative)</option>
                          <option value="AB+">AB+ (Positive)</option>
                          <option value="AB-">AB- (Negative)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Medical Baseline */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                      2. Medical History & Safety Baseline
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Known Drug/Food Allergies (comma separated)
                        </label>
                        <input
                          type="text"
                          value={firstTimeForm.allergies}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, allergies: e.target.value })}
                          placeholder="e.g. Penicillin, Peanuts, Latex"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Pre-existing Chronic Conditions
                        </label>
                        <input
                          type="text"
                          value={firstTimeForm.chronicConditions}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, chronicConditions: e.target.value })}
                          placeholder="e.g. Hypertension, Asthma, Type 2 Diabetes"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Emergency Contact Name & Rel.
                        </label>
                        <input
                          type="text"
                          value={firstTimeForm.emergencyName}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, emergencyName: e.target.value })}
                          placeholder="e.g. Mary Wayne (Spouse)"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Emergency Contact Phone
                        </label>
                        <input
                          type="text"
                          value={firstTimeForm.emergencyPhone}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, emergencyPhone: e.target.value })}
                          placeholder="+1 (555) 999-9999"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Initial Visit Details & Vitals */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                      3. First-Time Visit Examination & Vitals
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div>
                        <label className="block text-[11px] text-slate-400">BP (mmHg)</label>
                        <input
                          type="text"
                          value={firstTimeForm.bp}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, bp: e.target.value })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400">Pulse (BPM)</label>
                        <input
                          type="number"
                          value={firstTimeForm.hr}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, hr: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400">SpO2 (%)</label>
                        <input
                          type="number"
                          value={firstTimeForm.spo2}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, spo2: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400">Temp (°F)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={firstTimeForm.temp}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, temp: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400">Weight (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={firstTimeForm.weight}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, weight: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Department
                        </label>
                        <select
                          value={firstTimeForm.department}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, department: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                        >
                          <option value="General Medicine">General Medicine</option>
                          <option value="Cardiology">Cardiology</option>
                          <option value="Pulmonology">Pulmonology</option>
                          <option value="Neurology">Neurology</option>
                          <option value="Nephrology">Nephrology</option>
                          <option value="Orthopedics">Orthopedics</option>
                          <option value="Gastroenterology">Gastroenterology</option>
                          <option value="Emergency Medicine">Emergency Medicine</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Attending Doctor
                        </label>
                        <select
                          value={firstTimeForm.attendingDoctor}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, attendingDoctor: e.target.value })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                        >
                          {DOCTORS_ROSTER.map((doc) => (
                            <option key={doc.id} value={doc.name}>
                              {doc.name} ({doc.department})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Triage Priority Level
                        </label>
                        <select
                          value={firstTimeForm.triageLevel}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, triageLevel: e.target.value as any })}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                        >
                          <option value="Routine">Routine (Standard OPD)</option>
                          <option value="Urgent">Urgent (Within 30m)</option>
                          <option value="Emergency">Emergency (Immediate)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Chief Complaint / Reason for First Visit *
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={firstTimeForm.chiefComplaint}
                          onChange={(e) => setFirstTimeForm({ ...firstTimeForm, chiefComplaint: e.target.value })}
                          placeholder="Describe current symptoms, onset, and duration..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsIntakeModalOpen(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      Complete First-Time Registration & Admission
                    </button>
                  </div>
                </form>
              ) : (
                /* ----------------- RETURNING PATIENT FORM (2nd Visit+) ----------------- */
                <form onSubmit={handleReturningSubmit} className="space-y-6">
                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                    <strong>Returning Patient Protocol (Second Visit+):</strong> Rapid check-in. The baseline details, allergies, blood type, and prior visit history are loaded instantly from the database. Only fresh vitals, current complaints, and doctor assignment are needed.
                  </div>

                  {/* Search for existing patient */}
                  {!selectedReturningPatient ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Step 1: Lookup Existing Patient Record
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={returningSearch}
                          onChange={(e) => setReturningSearch(e.target.value)}
                          placeholder="Search existing patient by ID (e.g. PT-2026-0104) or Name..."
                          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      {/* Search Results List */}
                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950 max-h-56 overflow-y-auto">
                        {returningSearchResults.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            {returningSearch.trim()
                              ? 'No matching patient record found.'
                              : 'Type patient name or ID above to search database...'}
                          </div>
                        ) : (
                          returningSearchResults.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedReturningPatient(p);
                                const lastVisit = p.visits[p.visits.length - 1];
                                if (lastVisit) {
                                  setReturningForm((prev) => ({
                                    ...prev,
                                    department: lastVisit.department,
                                    attendingDoctor: lastVisit.attendingDoctor,
                                  }));
                                }
                              }}
                              className="p-3 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between transition-colors"
                            >
                              <div>
                                <span className="font-semibold text-white">{p.fullName}</span>
                                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-emerald-400">{p.id}</span>
                                  <span>·</span>
                                  <span>Blood: {p.bloodGroup}</span>
                                  <span>·</span>
                                  <span>Past Visits: {p.visitCount}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="px-3 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 rounded-lg text-xs font-semibold transition-colors"
                              >
                                Select Patient
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Existing Patient Baseline Loaded Card */
                    <div className="space-y-5">
                      <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-xl flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-white">
                              {selectedReturningPatient.fullName}
                            </span>
                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              {selectedReturningPatient.id}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <span>Age: {selectedReturningPatient.age} ({selectedReturningPatient.gender})</span>
                            <span>·</span>
                            <span>Blood Group: <strong className="text-white">{selectedReturningPatient.bloodGroup}</strong></span>
                            <span>·</span>
                            <span>Total Past Visits: <strong className="text-amber-400">{selectedReturningPatient.visitCount}</strong></span>
                          </div>
                          {selectedReturningPatient.allergies.length > 0 && (
                            <div className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Known Allergies: {selectedReturningPatient.allergies.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedReturningPatient(null)}
                          className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded hover:bg-slate-700"
                        >
                          Change Patient
                        </button>
                      </div>

                      {/* Prior Visit Summary Banner */}
                      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Previous Visit (#{selectedReturningPatient.visitCount}):</span>{' '}
                        {selectedReturningPatient.visits[selectedReturningPatient.visits.length - 1]?.diagnosis || 'Routine checkup'} on{' '}
                        {selectedReturningPatient.visits[selectedReturningPatient.visits.length - 1]?.date}.
                      </div>

                      {/* New Visit Check-In Details */}
                      <div>
                        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">
                          Step 2: Log Visit #{selectedReturningPatient.visitCount + 1} Assessment
                        </h4>

                        {/* Current Vitals */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <div>
                            <label className="block text-[11px] text-slate-400">BP (mmHg)</label>
                            <input
                              type="text"
                              value={returningForm.bp}
                              onChange={(e) => setReturningForm({ ...returningForm, bp: e.target.value })}
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400">Pulse (BPM)</label>
                            <input
                              type="number"
                              value={returningForm.hr}
                              onChange={(e) => setReturningForm({ ...returningForm, hr: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400">SpO2 (%)</label>
                            <input
                              type="number"
                              value={returningForm.spo2}
                              onChange={(e) => setReturningForm({ ...returningForm, spo2: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400">Temp (°F)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={returningForm.temp}
                              onChange={(e) => setReturningForm({ ...returningForm, temp: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400">Weight (kg)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={returningForm.weight}
                              onChange={(e) => setReturningForm({ ...returningForm, weight: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Department
                            </label>
                            <select
                              value={returningForm.department}
                              onChange={(e) => setReturningForm({ ...returningForm, department: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                            >
                              <option value="Cardiology">Cardiology</option>
                              <option value="Pulmonology">Pulmonology</option>
                              <option value="Neurology">Neurology</option>
                              <option value="Nephrology">Nephrology</option>
                              <option value="Orthopedics">Orthopedics</option>
                              <option value="Gastroenterology">Gastroenterology</option>
                              <option value="General Medicine">General Medicine</option>
                              <option value="Emergency Medicine">Emergency Medicine</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Attending Doctor
                            </label>
                            <select
                              value={returningForm.attendingDoctor}
                              onChange={(e) => setReturningForm({ ...returningForm, attendingDoctor: e.target.value })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                            >
                              {DOCTORS_ROSTER.map((doc) => (
                                <option key={doc.id} value={doc.name}>
                                  {doc.name} ({doc.department})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Triage Priority Level
                            </label>
                            <select
                              value={returningForm.triageLevel}
                              onChange={(e) => setReturningForm({ ...returningForm, triageLevel: e.target.value as any })}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                            >
                              <option value="Routine">Routine (Follow-up)</option>
                              <option value="Urgent">Urgent Exacerbation</option>
                              <option value="Emergency">Emergency</option>
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Chief Complaint / Reason for Return Visit *
                            </label>
                            <textarea
                              rows={2}
                              required
                              value={returningForm.chiefComplaint}
                              onChange={(e) => setReturningForm({ ...returningForm, chiefComplaint: e.target.value })}
                              placeholder="Detail symptoms since last visit, medication tolerance, or reason for follow-up..."
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Updated Clinical Diagnosis / Assessment
                            </label>
                            <input
                              type="text"
                              value={returningForm.diagnosis}
                              onChange={(e) => setReturningForm({ ...returningForm, diagnosis: e.target.value })}
                              placeholder="e.g. Acute exacerbation, medication adjusted"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedReturningPatient(null)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-amber-400/20 cursor-pointer"
                        >
                          Save Returning Visit #{selectedReturningPatient.visitCount + 1}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Patient Dossier Full Clinical History View */}
      {selectedPatientForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/90">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  {selectedPatientForView.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedPatientForView.fullName}</h2>
                    <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {selectedPatientForView.id}
                    </span>
                    {selectedPatientForView.visitCount === 1 ? (
                      <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                        1st Time Visitor
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        Returning Patient ({selectedPatientForView.visitCount} Total Visits)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                    <span>{selectedPatientForView.age} years old</span>
                    <span>·</span>
                    <span>DOB: {selectedPatientForView.dob}</span>
                    <span>·</span>
                    <span>Blood: <strong className="text-white">{selectedPatientForView.bloodGroup}</strong></span>
                    <span>·</span>
                    <span>Phone: {selectedPatientForView.phone}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedPatientForView(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Baseline Summary Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Known Allergies:</span>
                  <div className="font-semibold text-rose-400">
                    {selectedPatientForView.allergies.length > 0
                      ? selectedPatientForView.allergies.join(', ')
                      : 'No known drug allergies (NKDA)'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Chronic Medical Conditions:</span>
                  <div className="font-semibold text-slate-200">
                    {selectedPatientForView.chronicConditions.length > 0
                      ? selectedPatientForView.chronicConditions.join(', ')
                      : 'None reported'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">Emergency Contact:</span>
                  <div className="font-semibold text-slate-200">
                    {selectedPatientForView.emergencyContact.name} ({selectedPatientForView.emergencyContact.relationship}) -{' '}
                    <span className="font-mono">{selectedPatientForView.emergencyContact.phone}</span>
                  </div>
                </div>
              </div>

              {/* Complete Visit Timeline */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Chronological Visits Timeline ({selectedPatientForView.visits.length} Recorded Visits)</span>
                  </h3>

                  {/* Quick button to record next visit for this patient */}
                  <button
                    onClick={() => {
                      setSelectedReturningPatient(selectedPatientForView);
                      setIntakeMode('returning');
                      setIsIntakeModalOpen(true);
                      setSelectedPatientForView(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Visit #{selectedPatientForView.visitCount + 1}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedPatientForView.visits
                    .slice()
                    .reverse()
                    .map((visit) => (
                      <div
                        key={visit.visitId}
                        className="bg-slate-950/70 border border-slate-800 rounded-xl p-4.5 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                visit.isFirstVisit
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              }`}
                            >
                              Visit #{visit.visitNumber} {visit.isFirstVisit && '(Initial Admission)'}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {visit.date} at {visit.time}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400">Doctor:</span>
                            <strong className="text-white">{visit.attendingDoctor}</strong>
                            <span className="text-slate-600">·</span>
                            <span className="text-slate-400">{visit.department}</span>
                          </div>
                        </div>

                        {/* Vitals Ribbon */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 bg-slate-900 rounded-lg font-mono text-xs">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Blood Pressure:</span>
                            <span className="text-white font-semibold">{visit.vitals.bloodPressure} mmHg</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Heart Rate:</span>
                            <span className="text-white font-semibold">{visit.vitals.heartRate} bpm</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">SpO2:</span>
                            <span className="text-emerald-400 font-semibold">{visit.vitals.spo2}%</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Temperature:</span>
                            <span className="text-white font-semibold">{visit.vitals.temperature}°F</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Weight:</span>
                            <span className="text-white font-semibold">{visit.vitals.weight} kg</span>
                          </div>
                        </div>

                        {/* Clinical Content */}
                        <div className="text-xs space-y-1.5">
                          <p>
                            <strong className="text-slate-400">Chief Complaint:</strong>{' '}
                            <span className="text-slate-200">{visit.chiefComplaint}</span>
                          </p>
                          <p>
                            <strong className="text-slate-400">Diagnosis:</strong>{' '}
                            <span className="text-emerald-400 font-semibold">{visit.diagnosis}</span>
                          </p>
                          {visit.prescription && visit.prescription.length > 0 && (
                            <p>
                              <strong className="text-slate-400">Prescription:</strong>{' '}
                              <span className="text-cyan-300 font-mono">
                                {visit.prescription.join(' · ')}
                              </span>
                            </p>
                          )}
                          <p className="text-slate-400 bg-slate-900/50 p-2 rounded">
                            <strong className="text-slate-300">Clinical Notes:</strong> {visit.clinicalNotes}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedPatientForView(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
