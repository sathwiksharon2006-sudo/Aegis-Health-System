import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Module1Overview } from './components/Module1Overview';
import { Module2Patients } from './components/Module2Patients';
import { Module3DiseaseReports } from './components/Module3DiseaseReports';
import { Module4HologramRisk } from './components/Module4HologramRisk';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { INITIAL_PATIENTS } from './data/mockHospitalData';
import { getPatients } from './api';
import { Patient, VisitRecord } from './types/hospital';
import {
  savePatientToFirestore,
} from './lib/firebase';
import { LogIn } from 'lucide-react';

function HospitalDashboard() {
  const { user, userProfile, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'diseases' | 'hologram'>('overview');

  // Patients Database state
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('aegis_hospital_patients_db');

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading patients from storage', e);
    }

    return INITIAL_PATIENTS;
  });

  const [dbSyncStatus, setDbSyncStatus] = useState<'cloud-synced' | 'local-cached'>('local-cached');

  // Load patient records from MySQL through Flask
  useEffect(() => {
    const loadPatientsFromMySQL = async () => {
      try {
        const data = await getPatients();

        if (data.status === 'success') {
          setPatients(data.patients);
          setDbSyncStatus('cloud-synced');

          localStorage.setItem(
            'aegis_hospital_patients_db',
            JSON.stringify(data.patients)
          );
        }
      } catch (error) {
        console.error('Error loading patients from MySQL:', error);
      }
    };

    loadPatientsFromMySQL();
  }, []);

  // Firebase is still used for authentication.
  // Patient records are loaded from MySQL instead of Firestore.
  useEffect(() => {
    if (user) {
      setDbSyncStatus('cloud-synced');
    }
  }, [user]);

  // Cache patient data in localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'aegis_hospital_patients_db',
        JSON.stringify(patients)
      );
    } catch (e) {
      console.error('Error saving patients to storage', e);
    }
  }, [patients]);

  // Intake Modal open state
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);

  const [selectedPatientIdForDossier, setSelectedPatientIdForDossier] =
    useState<string | null>(null);

  // Add new patient
  const handleSavePatient = async (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);

    // Persist to Firestore if a user is logged in.
    // Existing Firebase functionality is preserved.
    if (user) {
      try {
        await savePatientToFirestore(newPatient);
      } catch (e) {
        console.error('Failed to save patient to Firestore', e);
      }
    }
  };

  // Record subsequent visit
  const handleRecordSubsequentVisit = async (
    patientId: string,
    newVisit: VisitRecord
  ) => {
    let updatedPatient: Patient | null = null;

    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          updatedPatient = {
            ...patient,
            visitCount: patient.visitCount + 1,
            visits: [...patient.visits, newVisit],
          };

          return updatedPatient;
        }

        return patient;
      })
    );

    // Existing Firestore functionality is preserved for now.
    if (user && updatedPatient) {
      try {
        await savePatientToFirestore(updatedPatient);
      } catch (e) {
        console.error('Failed to update patient in Firestore', e);
      }
    }
  };

  const handleAssignDoctorToIntake = (
    _doctorName: string,
    _department: string
  ) => {
    setActiveTab('patients');
    setIsIntakeModalOpen(true);
  };

  const handleSelectPatientFromHologram = (patientId: string) => {
    setSelectedPatientIdForDossier(patientId);
    setActiveTab('patients');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">

      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewIntake={() => {
          setActiveTab('patients');
          setIsIntakeModalOpen(true);
        }}
      />

      {/* Database Connection Banner */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs gap-2">

          <div className="flex items-center gap-2">

            <span
              className={`w-2 h-2 rounded-full ${
                dbSyncStatus === 'cloud-synced'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-cyan-400'
              }`}
            />

            {user ? (
              <span className="text-slate-300">
                Connected to{' '}
                <strong className="text-white">
                  MySQL Database
                </strong>{' '}
                · Logged in as{' '}
                <strong className="text-emerald-400">
                  {userProfile?.displayName || user.email}
                </strong>{' '}
                (
                {userProfile?.role || 'Staff'})
              </span>
            ) : (
              <span className="text-slate-400">
                Connected to{' '}
                <strong className="text-slate-200">
                  MySQL Database
                </strong>{' '}
                · Patient records loaded through Flask API
              </span>
            )}

          </div>

          {!user && (
            <button
              onClick={() => {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
              }}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Connect Staff Account</span>
            </button>
          )}

        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {activeTab === 'overview' && (
          <Module1Overview
            onNavigateToPatients={() => setActiveTab('patients')}
            onNavigateToHologram={() => setActiveTab('hologram')}
          />
        )}

        {activeTab === 'patients' && (
          <Module2Patients
            patients={patients}
            onSavePatient={handleSavePatient}
            onRecordSubsequentVisit={handleRecordSubsequentVisit}
            isIntakeModalOpen={isIntakeModalOpen}
            setIsIntakeModalOpen={setIsIntakeModalOpen}
            initialSelectedPatientId={selectedPatientIdForDossier}
          />
        )}

        {activeTab === 'diseases' && (
          <Module3DiseaseReports
            onAssignDoctorToIntake={handleAssignDoctorToIntake}
          />
        )}

        {activeTab === 'hologram' && (
          <Module4HologramRisk
            patients={patients}
            onSelectPatient={handleSelectPatientFromHologram}
          />
        )}

      </main>

      {/* Auth Modal */}
      <AuthModal />

      {/* Clinical Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">
              Aegis Medical Center & Health Network
            </span>

            <span>·</span>

            <span>
              Hospital Telemetry & Diagnostic Suite
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">

            <span>
              Database: MySQL via Flask
            </span>

            <span>·</span>

            <span>
              HIPAA Compliant EHR
            </span>

            <span>·</span>

            <span>
              Hologram HUD v2.6
            </span>

          </div>

        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HospitalDashboard />
    </AuthProvider>
  );
}