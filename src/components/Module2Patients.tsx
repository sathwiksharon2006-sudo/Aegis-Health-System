import React, { useState, useMemo } from 'react';
import { Patient, VisitRecord, TriageLevel, PatientStatus } from '../types/hospital';
import {
  Users,
  Search,
  Plus,
  AlertTriangle,
  FileText,
  Clock,
  X,
  Stethoscope,
  CheckCircle2,
} from 'lucide-react';

interface Module2PatientsProps {
  patients: Patient[];
  onSavePatient: (patient: Patient) => void;
  onRecordSubsequentVisit: (patientId: string, newVisit: VisitRecord) => void;
  isIntakeModalOpen: boolean;
  setIsIntakeModalOpen: (open: boolean) => void;
  initialSelectedPatientId?: string | null;
}

const HOSPITAL_DOCTORS = [
  {
    id: 1,
    name: 'Dr. Arjun Reddy',
    department: 'Cardiology',
  },
  {
    id: 2,
    name: 'Dr. Priya Sharma',
    department: 'Pulmonology',
  },
  {
    id: 3,
    name: 'Dr. Rahul Verma',
    department: 'Orthopedics',
  },
  {
    id: 4,
    name: 'Dr. Sneha Rao',
    department: 'Neurology',
  },
  {
    id: 5,
    name: 'Dr. Kiran Kumar',
    department: 'General Medicine',
  },
  {
    id: 6,
    name: 'Dr. Ananya Iyer',
    department: 'Nephrology',
  },
  {
    id: 7,
    name: 'Dr. Meera Nair',
    department: 'Pediatrics',
  },
];

export const Module2Patients: React.FC<Module2PatientsProps> = ({
  patients,
  onSavePatient,
  onRecordSubsequentVisit,
  isIntakeModalOpen,
  setIsIntakeModalOpen,
  initialSelectedPatientId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [visitTypeFilter, setVisitTypeFilter] = useState<
    'all' | 'first-time' | 'returning'
  >('all');

  const [deptFilter, setDeptFilter] = useState<string>('all');

  const [selectedPatientForView, setSelectedPatientForView] =
    useState<Patient | null>(() => {
      if (initialSelectedPatientId) {
        return (
          patients.find(
            (p) => p.id === initialSelectedPatientId
          ) || null
        );
      }

      return null;
    });

  const [intakeMode, setIntakeMode] = useState<
    'first-time' | 'returning'
  >('first-time');

  /*
   * FIRST-TIME PATIENT FORM
   *
   * Important:
   * All clinical values start empty.
   * We do not insert invented medical values into MySQL.
   */
  const [firstTimeForm, setFirstTimeForm] = useState({
    fullName: '',
    dob: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    phone: '',
    email: '',
    nationalId: '',
    address: '',
    bloodGroup: '' as Patient['bloodGroup'],
    allergies: '',
    chronicConditions: '',
    emergencyName: '',
    emergencyRel: '',
    emergencyPhone: '',

    department: 'General Medicine',
    attendingDoctor: 'Dr. Kiran Kumar',

    chiefComplaint: '',

    bp: '',
    hr: '',
    spo2: '',
    temp: '',
    weight: '',

    triageLevel: 'Routine' as TriageLevel,

    diagnosis: '',
    prescription: '',
    clinicalNotes: '',
  });

  /*
   * RETURNING PATIENT FORM
   *
   * This part is still using the existing local workflow.
   * We will connect it to MySQL after the first-time
   * registration workflow is confirmed working.
   */
  const [returningSearch, setReturningSearch] = useState('');

  const [selectedReturningPatient, setSelectedReturningPatient] =
    useState<Patient | null>(null);

  const [returningForm, setReturningForm] = useState({
    department: 'Cardiology',
    attendingDoctor: 'Dr. Arjun Reddy',
    chiefComplaint: '',
    bp: '',
    hr: '',
    spo2: '',
    temp: '',
    weight: '',
    triageLevel: 'Routine' as TriageLevel,
    diagnosis: '',
    prescription: '',
    clinicalNotes: '',
    status: 'Under Care' as PatientStatus,
  });

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesSearch =
        patient.fullName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        patient.id
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        patient.nationalId
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        patient.phone.includes(searchQuery) ||
        patient.visits.some((v) =>
          v.diagnosis
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        );

      const matchesType =
        visitTypeFilter === 'all'
          ? true
          : visitTypeFilter === 'first-time'
          ? patient.visitCount === 1
          : patient.visitCount >= 2;

      const matchesDept =
        deptFilter === 'all'
          ? true
          : patient.visits[
              patient.visits.length - 1
            ]?.department === deptFilter;

      return matchesSearch && matchesType && matchesDept;
    });
  }, [
    patients,
    searchQuery,
    visitTypeFilter,
    deptFilter,
  ]);

  /*
   * FIRST-TIME PATIENT
   *
   * This now writes directly to:
   *
   * Flask
   *   ↓
   * /api/patient-intake
   *   ↓
   * MySQL
   *
   * The backend creates:
   * - patient
   * - visit
   * - measurements
   * inside one transaction.
   */
  const handleFirstTimeSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!firstTimeForm.fullName.trim()) {
      alert('Please enter the patient full name.');
      return;
    }

    if (!firstTimeForm.phone.trim()) {
      alert('Please enter the patient phone number.');
      return;
    }

    if (!firstTimeForm.dob) {
      alert('Please enter the patient date of birth.');
      return;
    }

    if (!firstTimeForm.chiefComplaint.trim()) {
      alert(
        'Please enter the chief complaint / reason for the visit.'
      );
      return;
    }

    if (!firstTimeForm.bloodGroup) {
      alert('Please select the patient blood group.');
      return;
    }

    const selectedDoctor = HOSPITAL_DOCTORS.find(
      (doctor) =>
        doctor.name === firstTimeForm.attendingDoctor
    );

    if (!selectedDoctor) {
      alert(
        'Please select a valid doctor from the hospital database.'
      );
      return;
    }

    /*
     * Validate department and doctor relationship.
     */
    if (
      firstTimeForm.department !==
      selectedDoctor.department
    ) {
      alert(
        `The selected doctor belongs to ${selectedDoctor.department}. Please select the matching department.`
      );
      return;
    }

    /*
     * Build the request.
     *
     * Empty optional fields are sent as null.
     * We never manufacture medical values.
     */
    const requestBody = {
      patient_name:
        firstTimeForm.fullName.trim(),

      date_of_birth:
        firstTimeForm.dob,

      gender:
        firstTimeForm.gender,

      phone:
        firstTimeForm.phone.trim(),

      email:
        firstTimeForm.email.trim() || null,

      blood_group:
        firstTimeForm.bloodGroup || null,

      address:
        firstTimeForm.address.trim() || null,

      national_id:
        firstTimeForm.nationalId.trim() || null,

      allergies:
        firstTimeForm.allergies.trim() || null,

      chronic_conditions:
        firstTimeForm.chronicConditions.trim() || null,

      emergency_contact_name:
        firstTimeForm.emergencyName.trim() || null,

      emergency_contact_relationship:
        firstTimeForm.emergencyRel.trim() || null,

      emergency_contact_phone:
        firstTimeForm.emergencyPhone.trim() || null,

      doctor_id:
        selectedDoctor.id,

      visit_type:
        'Outpatient',

      chief_complaint:
        firstTimeForm.chiefComplaint.trim(),

      clinical_notes:
        firstTimeForm.clinicalNotes.trim() || null,

      triage_level:
        firstTimeForm.triageLevel || null,

      diagnosis:
        firstTimeForm.diagnosis.trim() || null,

      prescription:
        firstTimeForm.prescription.trim() || null,

      blood_pressure:
        firstTimeForm.bp.trim() || null,

      heart_rate:
        firstTimeForm.hr !== ''
          ? Number(firstTimeForm.hr)
          : null,

      oxygen_saturation:
        firstTimeForm.spo2 !== ''
          ? Number(firstTimeForm.spo2)
          : null,

      temperature:
        firstTimeForm.temp !== ''
          ? Number(firstTimeForm.temp)
          : null,

      weight:
        firstTimeForm.weight !== ''
          ? Number(firstTimeForm.weight)
          : null,
    };

    try {
      const response = await fetch(
        'http://127.0.0.1:5000/api/patient-intake',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Patient registration failed.'
        );
      }

      /*
       * Backend returns the REAL MySQL IDs.
       */
      const patientId = result.patient_id;
      const visitId = result.visit_id;

      alert(
        `Patient registered successfully.\n\nPatient ID: ${patientId}\nVisit ID: ${visitId}`
      );

      /*
       * Calculate age from the real DOB.
       */
      const birthDate = new Date(
        firstTimeForm.dob
      );

      const today = new Date();

      let age =
        today.getFullYear() -
        birthDate.getFullYear();

      const monthDifference =
        today.getMonth() -
        birthDate.getMonth();

      if (
        monthDifference < 0 ||
        (monthDifference === 0 &&
          today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      /*
       * Build the frontend representation using
       * the REAL database IDs.
       */
      const newPatient: Patient = {
        id: String(patientId),

        nationalId:
          firstTimeForm.nationalId || '',

        fullName:
          firstTimeForm.fullName,

        age: Math.max(age, 0),

        dob:
          firstTimeForm.dob,

        gender:
          firstTimeForm.gender,

        phone:
          firstTimeForm.phone,

        email:
          firstTimeForm.email || '',

        address:
          firstTimeForm.address || '',

        bloodGroup:
          firstTimeForm.bloodGroup,

        allergies:
          firstTimeForm.allergies
            ? firstTimeForm.allergies
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],

        chronicConditions:
          firstTimeForm.chronicConditions
            ? firstTimeForm.chronicConditions
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : [],

        emergencyContact: {
          name:
            firstTimeForm.emergencyName || '',

          relationship:
            firstTimeForm.emergencyRel || '',

          phone:
            firstTimeForm.emergencyPhone || '',
        },

        registrationDate:
          new Date()
            .toISOString()
            .split('T')[0],

        visitCount: 1,

        visits: [
          {
            visitId: String(visitId),

            visitNumber: 1,

            isFirstVisit: true,

            date:
              new Date()
                .toISOString()
                .split('T')[0],

            time:
              new Date().toLocaleTimeString(
                [],
                {
                  hour: '2-digit',
                  minute: '2-digit',
                }
              ),

            department:
              selectedDoctor.department,

            attendingDoctor:
              selectedDoctor.name,

            chiefComplaint:
              firstTimeForm.chiefComplaint,

            vitals: {
              bloodPressure:
                firstTimeForm.bp || '',

              heartRate:
                firstTimeForm.hr !== ''
                  ? Number(firstTimeForm.hr)
                  : 0,

              spo2:
                firstTimeForm.spo2 !== ''
                  ? Number(firstTimeForm.spo2)
                  : 0,

              temperature:
                firstTimeForm.temp !== ''
                  ? Number(firstTimeForm.temp)
                  : 0,

              weight:
                firstTimeForm.weight !== ''
                  ? Number(firstTimeForm.weight)
                  : 0,
            },

            triageLevel:
              firstTimeForm.triageLevel,

            diagnosis:
              firstTimeForm.diagnosis || '',

            prescription:
              firstTimeForm.prescription
                ? firstTimeForm.prescription
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],

            clinicalNotes:
              firstTimeForm.clinicalNotes || '',

            status:
              'Checked In',
          },
        ],
      };

      /*
       * Update the existing React state.
       */
      onSavePatient(newPatient);

      /*
       * Close intake modal.
       */
      setIsIntakeModalOpen(false);

      /*
       * Show newly registered patient dossier.
       */
      setSelectedPatientForView(
        newPatient
      );

      /*
       * Reset the form so the next patient
       * starts with empty values.
       */
      setFirstTimeForm({
        fullName: '',
        dob: '',
        gender: 'Male',
        phone: '',
        email: '',
        nationalId: '',
        address: '',
        bloodGroup: '',
        allergies: '',
        chronicConditions: '',
        emergencyName: '',
        emergencyRel: '',

        emergencyPhone: '',

        department: 'General Medicine',
        attendingDoctor: 'Dr. Kiran Kumar',

        chiefComplaint: '',

        bp: '',
        hr: '',
        spo2: '',
        temp: '',
        weight: '',

        triageLevel: 'Routine',

        diagnosis: '',
        prescription: '',
        clinicalNotes: '',
      });
    } catch (error) {
      console.error(
        'Patient intake error:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Unable to register patient. Please try again.'
      );
    }
  };

  /*
   * RETURNING PATIENT
   *
   * Existing local implementation.
   * We will connect this to MySQL separately.
   */
  const handleReturningSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!selectedReturningPatient) {
      alert(
        'Please search and select an existing patient first.'
      );
      return;
    }

    const nextVisitNumber =
      selectedReturningPatient.visitCount + 1;

    const newVisit: VisitRecord = {
      visitId: `VST-${Date.now()
        .toString()
        .slice(-6)}`,

      visitNumber:
        nextVisitNumber,

      isFirstVisit: false,

      date:
        new Date()
          .toISOString()
          .split('T')[0],

      time:
        new Date().toLocaleTimeString(
          [],
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        ),

      department:
        returningForm.department,

      attendingDoctor:
        returningForm.attendingDoctor,

      chiefComplaint:
        returningForm.chiefComplaint,

      vitals: {
        bloodPressure:
          returningForm.bp,

        heartRate:
          returningForm.hr !== ''
            ? Number(returningForm.hr)
            : 0,

        spo2:
          returningForm.spo2 !== ''
            ? Number(returningForm.spo2)
            : 0,

        temperature:
          returningForm.temp !== ''
            ? Number(returningForm.temp)
            : 0,

        weight:
          returningForm.weight !== ''
            ? Number(returningForm.weight)
            : 0,
      },

      triageLevel:
        returningForm.triageLevel,

      diagnosis:
        returningForm.diagnosis,

      prescription:
        returningForm.prescription
          ? returningForm.prescription
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],

      clinicalNotes:
        returningForm.clinicalNotes,

      status:
        returningForm.status,
    };

    onRecordSubsequentVisit(
      selectedReturningPatient.id,
      newVisit
    );

    setIsIntakeModalOpen(false);

    const updated = {
      ...selectedReturningPatient,

      visitCount:
        nextVisitNumber,

      visits: [
        ...selectedReturningPatient.visits,
        newVisit,
      ],
    };

    setSelectedPatientForView(
      updated
    );
  };

  const returningSearchResults =
    useMemo(() => {
      if (!returningSearch.trim()) {
        return [];
      }

      return patients.filter(
        (p) =>
          p.fullName
            .toLowerCase()
            .includes(
              returningSearch.toLowerCase()
            ) ||
          p.id
            .toLowerCase()
            .includes(
              returningSearch.toLowerCase()
            ) ||
          p.phone.includes(
            returningSearch
          )
      );
    }, [
      patients,
      returningSearch,
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 uppercase tracking-wider mb-1">
            <span>Module 02</span>
            <span aria-hidden="true">
              ·
            </span>
            <span>
              Clinical Records & Visit Lifecycle
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Patient Registry & Intake Management
          </h1>

          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Complete database of hospital patients.
            Full onboarding intake for first-time
            visitors vs. accelerated check-in for
            returning patients.
          </p>
        </div>

        <button
          onClick={() => {
            setIntakeMode(
              'first-time'
            );

            setIsIntakeModalOpen(
              true
            );
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>
            New Patient Intake
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">
              Total in Database
            </span>

            <p className="text-2xl font-bold text-white tabular-nums mt-0.5">
              {patients.length}
            </p>
          </div>

          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">
              First-Time Visitors
            </span>

            <p className="text-2xl font-bold text-cyan-400 tabular-nums mt-0.5">
              {
                patients.filter(
                  (p) =>
                    p.visitCount === 1
                ).length
              }
            </p>
          </div>

          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">
              Returning Patients
            </span>

            <p className="text-2xl font-bold text-amber-400 tabular-nums mt-0.5">
              {
                patients.filter(
                  (p) =>
                    p.visitCount >= 2
                ).length
              }
            </p>
          </div>

          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">
              Under Urgent/Emergency Care
            </span>

            <p className="text-2xl font-bold text-rose-400 tabular-nums mt-0.5">
              {
                patients.filter(
                  (p) => {
                    const lastVisit =
                      p.visits[
                        p.visits.length -
                          1
                      ];

                    return (
                      lastVisit?.triageLevel ===
                        'Emergency' ||
                      lastVisit?.triageLevel ===
                        'Urgent'
                    );
                  }
                ).length
              }
            </p>
          </div>

          <div className="w-10 h-10 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            placeholder="Search patient by name, ID, phone, diagnosis..."
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() =>
                setVisitTypeFilter(
                  'all'
                )
              }
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                visitTypeFilter ===
                'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Visits
            </button>

            <button
              onClick={() =>
                setVisitTypeFilter(
                  'first-time'
                )
              }
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                visitTypeFilter ===
                'first-time'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1st Time Only
            </button>

            <button
              onClick={() =>
                setVisitTypeFilter(
                  'returning'
                )
              }
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                visitTypeFilter ===
                'returning'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Returning
            </button>
          </div>

          <select
            value={deptFilter}
            onChange={(e) =>
              setDeptFilter(
                e.target.value
              )
            }
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">
              All Departments
            </option>
            <option value="Cardiology">
              Cardiology
            </option>
            <option value="Pulmonology">
              Pulmonology
            </option>
            <option value="Neurology">
              Neurology
            </option>
            <option value="Nephrology">
              Nephrology
            </option>
            <option value="Orthopedics">
              Orthopedics
            </option>
            <option value="Pediatrics">
              Pediatrics
            </option>
            <option value="General Medicine">
              General Medicine
            </option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">
                  Patient ID
                </th>
                <th className="py-3 px-4">
                  Patient Name & Demographics
                </th>
                <th className="py-3 px-4">
                  Visit Lifecycle
                </th>
                <th className="py-3 px-4">
                  Blood Group
                </th>
                <th className="py-3 px-4">
                  Latest Diagnosis / Reason
                </th>
                <th className="py-3 px-4">
                  Doctor & Dept
                </th>
                <th className="py-3 px-4">
                  Status / Triage
                </th>
                <th className="py-3 px-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/70">
              {filteredPatients.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-slate-400"
                  >
                    <p className="text-base font-semibold text-slate-300">
                      No patient records found
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Try adjusting your search criteria or register a new patient.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map(
                  (patient) => {
                    const latestVisit =
                      patient.visits[
                        patient.visits.length -
                          1
                      ];

                    const isFirstTime =
                      patient.visitCount ===
                      1;

                    return (
                      <tr
                        key={
                          patient.id
                        }
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() =>
                          setSelectedPatientForView(
                            patient
                          )
                        }
                      >
                        <td className="py-3 px-4 font-mono font-medium text-emerald-400 whitespace-nowrap">
                          {patient.id}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-white group-hover:text-emerald-300 transition-colors">
                            {
                              patient.fullName
                            }
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>
                              {
                                patient.age
                              }{' '}
                              yrs
                            </span>

                            <span>
                              ·
                            </span>

                            <span>
                              {
                                patient.gender
                              }
                            </span>

                            <span>
                              ·
                            </span>

                            <span className="font-mono">
                              {
                                patient.phone
                              }
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {isFirstTime ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold">
                              1st-Time Visit
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                              Returning (
                              {
                                patient.visitCount
                              }{' '}
                              visits)
                            </div>
                          )}

                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            Last:{' '}
                            {latestVisit?.date ||
                              patient.registrationDate}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                            {
                              patient.bloodGroup
                            }
                          </span>

                          {patient.allergies
                            .length >
                            0 && (
                            <div
                              className="text-[10px] text-rose-400 mt-1 max-w-[120px] truncate"
                              title={patient.allergies.join(
                                ', '
                              )}
                            >
                              Allergic:{' '}
                              {patient.allergies.join(
                                ', '
                              )}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div
                            className="font-medium text-slate-200 truncate"
                            title={
                              latestVisit?.diagnosis
                            }
                          >
                            {latestVisit?.diagnosis ||
                              'No diagnosis recorded'}
                          </div>

                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {latestVisit?.chiefComplaint ||
                              'No complaint recorded'}
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-300">
                            {latestVisit?.attendingDoctor ||
                              'Primary Physician'}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            {
                              latestVisit?.department
                            }
                          </div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold text-center ${
                                latestVisit?.triageLevel ===
                                'Emergency'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : latestVisit?.triageLevel ===
                                    'Urgent'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              }`}
                            >
                              {latestVisit?.triageLevel ||
                                'Not recorded'}
                            </span>

                            <span className="text-[10px] text-slate-400 font-mono text-center">
                              {latestVisit?.status ||
                                'Active'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(
                              e
                            ) => {
                              e.stopPropagation();

                              setSelectedPatientForView(
                                patient
                              );
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            View Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isIntakeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-400" />
                  Hospital Patient Intake & Check-In
                </h2>

                <p className="text-xs text-slate-400 mt-0.5">
                  First-time registration and returning patient check-in.
                </p>
              </div>

              <button
                onClick={() =>
                  setIsIntakeModalOpen(
                    false
                  )
                }
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 p-2 bg-slate-950 border-b border-slate-800 gap-2">
              <button
                type="button"
                onClick={() =>
                  setIntakeMode(
                    'first-time'
                  )
                }
                className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  intakeMode ===
                  'first-time'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>
                  1. First-Time Visit
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setIntakeMode(
                    'returning'
                  )
                }
                className={`py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  intakeMode ===
                  'returning'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />

                <span>
                  2. Returning Patient
                </span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {intakeMode ===
              'first-time' ? (
                <form
                  onSubmit={
                    handleFirstTimeSubmit
                  }
                  className="space-y-6"
                >
                  <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs text-cyan-300">
                    <strong>
                      First-Time Patient Protocol:
                    </strong>{' '}
                    Register the patient's actual demographic, safety, visit, and measured clinical information.
                  </div>

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
                          value={
                            firstTimeForm.fullName
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                fullName:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Enter patient's full name"
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
                          value={
                            firstTimeForm.dob
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                dob:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Gender
                        </label>

                        <select
                          value={
                            firstTimeForm.gender
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                gender:
                                  e.target
                                    .value as
                                    | 'Male'
                                    | 'Female'
                                    | 'Other',
                              }
                            )
                          }
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                        >
                          <option value="Male">
                            Male
                          </option>

                          <option value="Female">
                            Female
                          </option>

                          <option value="Other">
                            Other
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Phone Number *
                        </label>

                        <input
                          type="text"
                          required
                          value={
                            firstTimeForm.phone
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                phone:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Enter phone number"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Email
                        </label>

                        <input
                          type="email"
                          value={
                            firstTimeForm.email
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                email:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="patient@example.com"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          National ID
                        </label>

                        <input
                          type="text"
                          value={
                            firstTimeForm.nationalId
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                nationalId:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Enter national ID"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Address
                        </label>

                        <input
                          type="text"
                          value={
                            firstTimeForm.address
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                address:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Enter patient address"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Blood Group *
                        </label>

                        <select
                          required
                          value={
                            firstTimeForm.bloodGroup
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                bloodGroup:
                                  e.target
                                    .value as Patient['bloodGroup'],
                              }
                            )
                          }
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-mono"
                        >
                          <option value="">
                            Select
                          </option>
                          <option value="O+">
                            O+
                          </option>
                          <option value="O-">
                            O-
                          </option>
                          <option value="A+">
                            A+
                          </option>
                          <option value="A-">
                            A-
                          </option>
                          <option value="B+">
                            B+
                          </option>
                          <option value="B-">
                            B-
                          </option>
                          <option value="AB+">
                            AB+
                          </option>
                          <option value="AB-">
                            AB-
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                      2. Medical History & Safety Baseline
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Known Drug/Food Allergies
                        </label>

                        <input
                          type="text"
                          value={
                            firstTimeForm.allergies
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                allergies:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="e.g. Penicillin, Peanuts"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Chronic Conditions
                        </label>

                        <input
                          type="text"
                          value={
                            firstTimeForm.chronicConditions
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                chronicConditions:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="e.g. Hypertension, Asthma"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Emergency Contact Name
                        </label>

                        <input
                          type="text"
                          value={
                            firstTimeForm.emergencyName
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                emergencyName:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Enter emergency contact"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Relationship
                        </label>

                        <input
                          type="text"
                          value={
                            firstTimeForm.emergencyRel
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                emergencyRel:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="e.g. Father, Mother, Spouse"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Emergency Contact Phone
                        </label>

                        <input
                          type="text"
                          value={
                            firstTimeForm.emergencyPhone
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                emergencyPhone:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Enter emergency phone"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                      3. First-Time Visit Examination & Vitals
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <div>
                        <label className="block text-[11px] text-slate-400">
                          BP (mmHg)
                        </label>

                        <input
                          type="text"
                          value={
                            firstTimeForm.bp
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                bp:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="e.g. 120/80"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400">
                          Pulse (BPM)
                        </label>

                        <input
                          type="number"
                          value={
                            firstTimeForm.hr
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                hr:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="BPM"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400">
                          SpO2 (%)
                        </label>

                        <input
                          type="number"
                          value={
                            firstTimeForm.spo2
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                spo2:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="%"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400">
                          Temp (°F)
                        </label>

                        <input
                          type="number"
                          step="0.1"
                          value={
                            firstTimeForm.temp
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                temp:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="°F"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400">
                          Weight (kg)
                        </label>

                        <input
                          type="number"
                          step="0.1"
                          value={
                            firstTimeForm.weight
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                weight:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="kg"
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
                          value={
                            firstTimeForm.department
                          }
                          onChange={(
                            e
                          ) => {
                            const department =
                              e.target
                                .value;

                            const doctor =
                              HOSPITAL_DOCTORS.find(
                                (doc) =>
                                  doc.department ===
                                  department
                              );

                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                department,
                                attendingDoctor:
                                  doctor
                                    ?.name ||
                                  '',
                              }
                            );
                          }}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                        >
                          <option value="General Medicine">
                            General Medicine
                          </option>

                          <option value="Cardiology">
                            Cardiology
                          </option>

                          <option value="Pulmonology">
                            Pulmonology
                          </option>

                          <option value="Neurology">
                            Neurology
                          </option>

                          <option value="Nephrology">
                            Nephrology
                          </option>

                          <option value="Orthopedics">
                            Orthopedics
                          </option>

                          <option value="Pediatrics">
                            Pediatrics
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Attending Doctor
                        </label>

                        <select
                          value={
                            firstTimeForm.attendingDoctor
                          }
                          onChange={(
                            e
                          ) => {
                            const doctor =
                              HOSPITAL_DOCTORS.find(
                                (doc) =>
                                  doc.name ===
                                  e.target
                                    .value
                              );

                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                attendingDoctor:
                                  e.target
                                    .value,
                                department:
                                  doctor?.department ||
                                  firstTimeForm.department,
                              }
                            );
                          }}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                        >
                          {HOSPITAL_DOCTORS.map(
                            (doc) => (
                              <option
                                key={
                                  doc.id
                                }
                                value={
                                  doc.name
                                }
                              >
                                {
                                  doc.name
                                }{' '}
                                (
                                {
                                  doc.department
                                }
                                )
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Triage Priority
                        </label>

                        <select
                          value={
                            firstTimeForm.triageLevel
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                triageLevel:
                                  e.target
                                    .value as TriageLevel,
                              }
                            )
                          }
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                        >
                          <option value="Routine">
                            Routine
                          </option>

                          <option value="Urgent">
                            Urgent
                          </option>

                          <option value="Emergency">
                            Emergency
                          </option>
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Chief Complaint / Reason for First Visit *
                        </label>

                        <textarea
                          rows={2}
                          required
                          value={
                            firstTimeForm.chiefComplaint
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                chiefComplaint:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Describe the actual symptoms or reason for visit..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Clinical Diagnosis / Assessment
                        </label>

                        <input
                          type="text"
                          value={
                            firstTimeForm.diagnosis
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                diagnosis:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Enter only the clinician's actual assessment"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Prescription
                        </label>

                        <input
                          type="text"
                          value={
                            firstTimeForm.prescription
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                prescription:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Enter prescribed medicines, separated by commas"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Clinical Notes
                        </label>

                        <textarea
                          rows={3}
                          value={
                            firstTimeForm.clinicalNotes
                          }
                          onChange={(
                            e
                          ) =>
                            setFirstTimeForm(
                              {
                                ...firstTimeForm,
                                clinicalNotes:
                                  e.target
                                    .value,
                              }
                            )
                          }
                          placeholder="Enter actual clinical notes"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs sm:text-sm text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setIsIntakeModalOpen(
                          false
                        )
                      }
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs sm:text-sm cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-500/20 cursor-pointer"
                    >
                      Save Patient to Database
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={
                    handleReturningSubmit
                  }
                  className="space-y-6"
                >
                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                    <strong>
                      Returning Patient Protocol:
                    </strong>{' '}
                    Search the existing patient and record the new visit.
                  </div>

                  {!selectedReturningPatient ? (
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Search Existing Patient
                      </label>

                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                        <input
                          type="text"
                          value={
                            returningSearch
                          }
                          onChange={(
                            e
                          ) =>
                            setReturningSearch(
                              e.target
                                .value
                            )
                          }
                          placeholder="Search patient by ID, name or phone..."
                          className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl bg-slate-950 max-h-56 overflow-y-auto">
                        {returningSearchResults.length ===
                        0 ? (
                          <div className="p-4 text-center text-xs text-slate-500">
                            {returningSearch.trim()
                              ? 'No matching patient record found.'
                              : 'Type patient name, ID or phone above.'}
                          </div>
                        ) : (
                          returningSearchResults.map(
                            (p) => (
                              <div
                                key={
                                  p.id
                                }
                                onClick={() => {
                                  setSelectedReturningPatient(
                                    p
                                  );

                                  const lastVisit =
                                    p.visits[
                                      p.visits.length -
                                        1
                                    ];

                                  if (
                                    lastVisit
                                  ) {
                                    setReturningForm(
                                      (
                                        prev
                                      ) => ({
                                        ...prev,
                                        department:
                                          lastVisit.department,
                                        attendingDoctor:
                                          lastVisit.attendingDoctor,
                                      })
                                    );
                                  }
                                }}
                                className="p-3 hover:bg-slate-800/60 cursor-pointer flex items-center justify-between"
                              >
                                <div>
                                  <span className="font-semibold text-white">
                                    {
                                      p.fullName
                                    }
                                  </span>

                                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                    <span className="font-mono text-emerald-400">
                                      {
                                        p.id
                                      }
                                    </span>

                                    <span>
                                      ·
                                    </span>

                                    <span>
                                      Blood:{' '}
                                      {
                                        p.bloodGroup
                                      }
                                    </span>

                                    <span>
                                      ·
                                    </span>

                                    <span>
                                      Past Visits:{' '}
                                      {
                                        p.visitCount
                                      }
                                    </span>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="px-3 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 rounded-lg text-xs font-semibold"
                                >
                                  Select
                                </button>
                              </div>
                            )
                          )
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-xl flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-white">
                              {
                                selectedReturningPatient.fullName
                              }
                            </span>

                            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                              {
                                selectedReturningPatient.id
                              }
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                            <span>
                              Age:{' '}
                              {
                                selectedReturningPatient.age
                              }
                            </span>

                            <span>
                              ·
                            </span>

                            <span>
                              Blood Group:{' '}
                              <strong className="text-white">
                                {
                                  selectedReturningPatient.bloodGroup
                                }
                              </strong>
                            </span>

                            <span>
                              ·
                            </span>

                            <span>
                              Total Past Visits:{' '}
                              <strong className="text-amber-400">
                                {
                                  selectedReturningPatient.visitCount
                                }
                              </strong>
                            </span>
                          </div>

                          {selectedReturningPatient
                            .allergies.length >
                            0 && (
                            <div className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />

                              <span>
                                Known Allergies:{' '}
                                {selectedReturningPatient.allergies.join(
                                  ', '
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReturningPatient(
                              null
                            )
                          }
                          className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded"
                        >
                          Change Patient
                        </button>
                      </div>

                      <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">
                          Previous Visit:
                        </span>{' '}
                        {
                          selectedReturningPatient
                            .visits[
                            selectedReturningPatient
                              .visits.length -
                              1
                          ]?.diagnosis
                        }
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">
                          New Visit Assessment
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <div>
                            <label className="block text-[11px] text-slate-400">
                              BP
                            </label>

                            <input
                              type="text"
                              value={
                                returningForm.bp
                              }
                              onChange={(
                                e
                              ) =>
                                setReturningForm(
                                  {
                                    ...returningForm,
                                    bp:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-400">
                              Pulse
                            </label>

                            <input
                              type="number"
                              value={
                                returningForm.hr
                              }
                              onChange={(
                                e
                              ) =>
                                setReturningForm(
                                  {
                                    ...returningForm,
                                    hr:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-400">
                              SpO2
                            </label>

                            <input
                              type="number"
                              value={
                                returningForm.spo2
                              }
                              onChange={(
                                e
                              ) =>
                                setReturningForm(
                                  {
                                    ...returningForm,
                                    spo2:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-400">
                              Temp
                            </label>

                            <input
                              type="number"
                              step="0.1"
                              value={
                                returningForm.temp
                              }
                              onChange={(
                                e
                              ) =>
                                setReturningForm(
                                  {
                                    ...returningForm,
                                    temp:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] text-slate-400">
                              Weight
                            </label>

                            <input
                              type="number"
                              step="0.1"
                              value={
                                returningForm.weight
                              }
                              onChange={(
                                e
                              ) =>
                                setReturningForm(
                                  {
                                    ...returningForm,
                                    weight:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Department
                            </label>

                            <select
                              value={
                                returningForm.department
                              }
                              onChange={(
                                e
                              ) => {
                                const department =
                                  e.target
                                    .value;

                                const doctor =
                                  HOSPITAL_DOCTORS.find(
                                    (
                                      doc
                                    ) =>
                                      doc.department ===
                                      department
                                  );

                                setReturningForm(
                                  {
                                    ...returningForm,
                                    department,
                                    attendingDoctor:
                                      doctor
                                        ?.name ||
                                      '',
                                  }
                                );
                              }}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                            >
                              {HOSPITAL_DOCTORS.map(
                                (
                                  doc
                                ) => (
                                  <option
                                    key={
                                      doc.id
                                    }
                                    value={
                                      doc.department
                                    }
                                  >
                                    {
                                      doc.department
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Attending Doctor
                            </label>

                            <select
                              value={
                                returningForm.attendingDoctor
                              }
                              onChange={(
                                e
                              ) =>
                                setReturningForm(
                                  {
                                    ...returningForm,
                                    attendingDoctor:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                            >
                              {HOSPITAL_DOCTORS.filter(
                                (
                                  doc
                                ) =>
                                  doc.department ===
                                  returningForm.department
                              ).map(
                                (
                                  doc
                                ) => (
                                  <option
                                    key={
                                      doc.id
                                    }
                                    value={
                                      doc.name
                                    }
                                  >
                                    {
                                      doc.name
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Triage
                            </label>

                            <select
                              value={
                                returningForm.triageLevel
                              }
                              onChange={(
                                e
                              ) =>
                                setReturningForm(
                                  {
                                    ...returningForm,
                                    triageLevel:
                                      e.target
                                        .value as TriageLevel,
                                  }
                                )
                              }
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                            >
                              <option value="Routine">
                                Routine
                              </option>

                              <option value="Urgent">
                                Urgent
                              </option>

                              <option value="Emergency">
                                Emergency
                              </option>
                            </select>
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Chief Complaint *
                            </label>

                            <textarea
                              rows={2}
                              required
                              value={
                                returningForm.chiefComplaint
                              }
                              onChange={(
                                e
                              ) =>
                                setReturningForm(
                                  {
                                    ...returningForm,
                                    chiefComplaint:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-slate-400 mb-1">
                              Updated Diagnosis
                            </label>

                            <input
                              type="text"
                              value={
                                returningForm.diagnosis
                              }
                              onChange={(
                                e
                              ) =>
                                setReturningForm(
                                  {
                                    ...returningForm,
                                    diagnosis:
                                      e.target
                                        .value,
                                  }
                                )
                              }
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReturningPatient(
                              null
                            )
                          }
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs cursor-pointer"
                        >
                          Back
                        </button>

                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Save Returning Visit
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

      {selectedPatientForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/90">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg">
                  {selectedPatientForView.fullName
                    .slice(0, 2)
                    .toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-white">
                      {
                        selectedPatientForView.fullName
                      }
                    </h2>

                    <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                      {
                        selectedPatientForView.id
                      }
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-2 mt-1 flex-wrap">
                    <span>
                      {
                        selectedPatientForView.age
                      }{' '}
                      years old
                    </span>

                    <span>
                      ·
                    </span>

                    <span>
                      DOB:{' '}
                      {
                        selectedPatientForView.dob
                      }
                    </span>

                    <span>
                      ·
                    </span>

                    <span>
                      Blood:{' '}
                      <strong className="text-white">
                        {
                          selectedPatientForView.bloodGroup
                        }
                      </strong>
                    </span>

                    <span>
                      ·
                    </span>

                    <span>
                      Phone:{' '}
                      {
                        selectedPatientForView.phone
                      }
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  setSelectedPatientForView(
                    null
                  )
                }
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">
                    Known Allergies:
                  </span>

                  <div className="font-semibold text-rose-400">
                    {selectedPatientForView
                      .allergies.length >
                    0
                      ? selectedPatientForView.allergies.join(
                          ', '
                        )
                      : 'No allergies recorded'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">
                    Chronic Medical Conditions:
                  </span>

                  <div className="font-semibold text-slate-200">
                    {selectedPatientForView
                      .chronicConditions
                      .length >
                    0
                      ? selectedPatientForView.chronicConditions.join(
                          ', '
                        )
                      : 'None recorded'}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 block mb-0.5">
                    Emergency Contact:
                  </span>

                  <div className="font-semibold text-slate-200">
                    {selectedPatientForView
                      .emergencyContact
                      .name || 'Not recorded'}
                  </div>

                  {selectedPatientForView
                    .emergencyContact
                    .phone && (
                    <div className="font-mono mt-1">
                      {
                        selectedPatientForView
                          .emergencyContact
                          .phone
                      }
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Chronological Visits Timeline
                  </h3>

                  <button
                    onClick={() => {
                      setSelectedReturningPatient(
                        selectedPatientForView
                      );

                      setIntakeMode(
                        'returning'
                      );

                      setIsIntakeModalOpen(
                        true
                      );

                      setSelectedPatientForView(
                        null
                      );
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />

                    <span>
                      Record Visit #
                      {selectedPatientForView.visitCount +
                        1}
                    </span>
                  </button>
                </div>

                <div className="space-y-4">
                  {selectedPatientForView.visits
                    .slice()
                    .reverse()
                    .map(
                      (visit) => (
                        <div
                          key={
                            visit.visitId
                          }
                          className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
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
                                Visit #
                                {
                                  visit.visitNumber
                                }
                              </span>

                              <span className="text-xs text-slate-400 font-mono">
                                {
                                  visit.date
                                }{' '}
                                at{' '}
                                {
                                  visit.time
                                }
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-400">
                                Doctor:
                              </span>

                              <strong className="text-white">
                                {
                                  visit.attendingDoctor
                                }
                              </strong>

                              <span className="text-slate-600">
                                ·
                              </span>

                              <span className="text-slate-400">
                                {
                                  visit.department
                                }
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 bg-slate-900 rounded-lg font-mono text-xs">
                            <div>
                              <span className="text-[10px] text-slate-500 block">
                                Blood Pressure:
                              </span>

                              <span className="text-white font-semibold">
                                {visit.vitals.bloodPressure ||
                                  'Not recorded'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 block">
                                Heart Rate:
                              </span>

                              <span className="text-white font-semibold">
                                {visit.vitals.heartRate ||
                                  'Not recorded'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 block">
                                SpO2:
                              </span>

                              <span className="text-emerald-400 font-semibold">
                                {visit.vitals.spo2 ||
                                  'Not recorded'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 block">
                                Temperature:
                              </span>

                              <span className="text-white font-semibold">
                                {visit.vitals.temperature ||
                                  'Not recorded'}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 block">
                                Weight:
                              </span>

                              <span className="text-white font-semibold">
                                {visit.vitals.weight ||
                                  'Not recorded'}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs space-y-1.5">
                            <p>
                              <strong className="text-slate-400">
                                Chief Complaint:
                              </strong>{' '}
                              <span className="text-slate-200">
                                {
                                  visit.chiefComplaint
                                }
                              </span>
                            </p>

                            {visit.diagnosis && (
                              <p>
                                <strong className="text-slate-400">
                                  Diagnosis:
                                </strong>{' '}
                                <span className="text-emerald-400 font-semibold">
                                  {
                                    visit.diagnosis
                                  }
                                </span>
                              </p>
                            )}

                            {visit.prescription &&
                              visit.prescription
                                .length >
                                0 && (
                                <p>
                                  <strong className="text-slate-400">
                                    Prescription:
                                  </strong>{' '}
                                  <span className="text-cyan-300 font-mono">
                                    {visit.prescription.join(
                                      ' · '
                                    )}
                                  </span>
                                </p>
                              )}

                            {visit.clinicalNotes && (
                              <p className="text-slate-400 bg-slate-900/50 p-2 rounded">
                                <strong className="text-slate-300">
                                  Clinical Notes:
                                </strong>{' '}
                                {
                                  visit.clinicalNotes
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() =>
                  setSelectedPatientForView(
                    null
                  )
                }
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
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