import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Module1Overview } from './components/Module1Overview';
import { Module2Patients } from './components/Module2Patients';
import { Module3DiseaseReports } from './components/Module3DiseaseReports';
import { Module4HologramRisk } from './components/Module4HologramRisk';
import { AuthModal } from './components/AuthModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  INITIAL_PATIENTS,
  DOCTORS_ROSTER,
  DISEASE_REPORTS,
  ANATOMICAL_RISK_PARTS,
  VISIT_OVERVIEW_METRICS,
} from './data/mockHospitalData';
import { Patient, VisitRecord, Doctor, DiseaseReport, AnatomicalRiskPart } from './types/hospital';
import {
  db,
  savePatientToFirestore,
  updateDoctorStatusInFirestore,
  updateDiseaseStatsInFirestore,
  updateAnatomicalRiskInFirestore,
  saveOverviewMetricsToFirestore,
  seedInitialPatientsIfEmpty,
  seedInitialDoctorsIfEmpty,
  seedInitialDiseaseReportsIfEmpty,
  seedInitialAnatomicalRisksIfEmpty,
  seedInitialOverviewMetricsIfEmpty,
  seedAllHospitalCollections,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { Database, LogIn, RefreshCw, CheckCircle2, Cloud } from 'lucide-react';

function HospitalDashboard() {
  const { user, userProfile, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'diseases' | 'hologram'>('overview');

  // Real-Time State Collections backed by Firestore
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem('aegis_hospital_patients_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_PATIENTS;
  });

  const [doctors, setDoctors] = useState<Doctor[]>(DOCTORS_ROSTER);
  const [diseaseReports, setDiseaseReports] = useState<DiseaseReport[]>(DISEASE_REPORTS);
  const [riskParts, setRiskParts] = useState<AnatomicalRiskPart[]>(ANATOMICAL_RISK_PARTS);
  const [overviewMetrics, setOverviewMetrics] = useState(VISIT_OVERVIEW_METRICS);
  const [dbSyncStatus, setDbSyncStatus] = useState<'cloud-live' | 'syncing' | 'offline'>('syncing');

  // 1. Real-time Listeners for Public/Hospital Collections (Doctors, Disease Reports, Hologram Risks, Overview)
  useEffect(() => {
    // Doctors Listener
    const unsubDoctors = onSnapshot(
      collection(db, 'doctors'),
      async (snap) => {
        if (!snap.empty) {
          const docs: Doctor[] = [];
          snap.forEach((d) => docs.push(d.data() as Doctor));
          setDoctors(docs);
        } else if (user) {
          await seedInitialDoctorsIfEmpty(0);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'doctors')
    );

    // Disease Reports Listener
    const unsubDiseases = onSnapshot(
      collection(db, 'disease_reports'),
      async (snap) => {
        if (!snap.empty) {
          const reports: DiseaseReport[] = [];
          snap.forEach((d) => reports.push(d.data() as DiseaseReport));
          setDiseaseReports(reports);
        } else if (user) {
          await seedInitialDiseaseReportsIfEmpty(0);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'disease_reports')
    );

    // Anatomical Risks Listener (Hologram Visualizer)
    const unsubRisks = onSnapshot(
      collection(db, 'anatomical_risks'),
      async (snap) => {
        if (!snap.empty) {
          const parts: AnatomicalRiskPart[] = [];
          snap.forEach((d) => parts.push(d.data() as AnatomicalRiskPart));
          setRiskParts(parts);
        } else if (user) {
          await seedInitialAnatomicalRisksIfEmpty(0);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'anatomical_risks')
    );

    // Overview Metrics Listener
    const unsubOverview = onSnapshot(
      doc(db, 'overview_metrics', 'hospital_telemetry_live'),
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.yearly && data?.weekly && data?.daily) {
            setOverviewMetrics(data as any);
          }
        } else if (user) {
          await seedInitialOverviewMetricsIfEmpty(false);
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'overview_metrics/hospital_telemetry_live')
    );

    return () => {
      unsubDoctors();
      unsubDiseases();
      unsubRisks();
      unsubOverview();
    };
  }, [user]);

  // 2. Real-time Listener for Patients (protected healthcare records)
  useEffect(() => {
    setDbSyncStatus('syncing');

    const unsubPatients = onSnapshot(
      collection(db, 'patients'),
      async (snapshot) => {
        if (!snapshot.empty) {
          const cloudPatients: Patient[] = [];
          snapshot.forEach((docSnap) => {
            cloudPatients.push(docSnap.data() as Patient);
          });
          cloudPatients.sort((a, b) => b.visitCount - a.visitCount);
          setPatients(cloudPatients);
          localStorage.setItem('aegis_hospital_patients_db', JSON.stringify(cloudPatients));
          setDbSyncStatus('cloud-live');
        } else {
          // If empty, seed initial patients
          await seedInitialPatientsIfEmpty(0);
          setDbSyncStatus('cloud-live');
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'patients');
      }
    );

    return () => unsubPatients();
  }, []);

  // Intake Modal open state
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);
  const [selectedPatientIdForDossier, setSelectedPatientIdForDossier] = useState<string | null>(null);

  // Add new patient (First-time visit)
  const handleSavePatient = async (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);

    // Persist to Cloud Firestore if connected
    if (user) {
      try {
        await savePatientToFirestore(newPatient);
      } catch (e) {
        console.error('Failed to save patient to Firestore', e);
      }
    }
  };

  // Record subsequent visit (Returning visit #2+)
  const handleRecordSubsequentVisit = async (patientId: string, newVisit: VisitRecord) => {
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

    if (user && updatedPatient) {
      try {
        await savePatientToFirestore(updatedPatient);
      } catch (e) {
        console.error('Failed to update patient in Firestore', e);
      }
    }
  };

  // Live doctor status update
  const handleUpdateDoctorStatus = async (
    doctorId: string,
    status: Doctor['status'],
    queue?: number
  ) => {
    setDoctors((prev) =>
      prev.map((d) => (d.id === doctorId ? { ...d, status, currentQueue: queue ?? d.currentQueue } : d))
    );
    if (user) {
      try {
        await updateDoctorStatusInFirestore(doctorId, status, queue);
      } catch (e) {
        console.error('Failed to update doctor in Firestore', e);
      }
    }
  };

  // Live disease case increment
  const handleAddDiseaseCase = async (diseaseId: string) => {
    setDiseaseReports((prev) =>
      prev.map((d) => {
        if (d.id === diseaseId) {
          return {
            ...d,
            dailyCount: d.dailyCount + 1,
            weeklyCount: d.weeklyCount + 1,
            monthlyCount: d.monthlyCount + 1,
            yearlyCount: d.yearlyCount + 1,
            activeCases: d.activeCases + 1,
          };
        }
        return d;
      })
    );
    const target = diseaseReports.find((d) => d.id === diseaseId);
    if (user && target) {
      try {
        await updateDiseaseStatsInFirestore(diseaseId, {
          dailyCount: target.dailyCount + 1,
          weeklyCount: target.weeklyCount + 1,
          monthlyCount: target.monthlyCount + 1,
          yearlyCount: target.yearlyCount + 1,
          activeCases: target.activeCases + 1,
        });
      } catch (e) {
        console.error('Failed to update disease case in Firestore', e);
      }
    }
  };

  // Live organ risk adjustment
  const handleUpdateRiskPart = async (riskId: string, updates: Partial<AnatomicalRiskPart>) => {
    setRiskParts((prev) => prev.map((p) => (p.id === riskId ? { ...p, ...updates } : p)));
    if (user) {
      try {
        await updateAnatomicalRiskInFirestore(riskId, updates);
      } catch (e) {
        console.error('Failed to update anatomical risk in Firestore', e);
      }
    }
  };

  const handleAssignDoctorToIntake = (_doctorName: string, _department: string) => {
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

      {/* Real-Time Database Connection Banner */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                dbSyncStatus === 'cloud-live'
                  ? 'bg-emerald-400 animate-pulse'
                  : dbSyncStatus === 'syncing'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-cyan-400'
              }`}
            />
            {user ? (
              <span className="text-slate-300">
                Firestore Cloud Database: <strong className="text-emerald-400">Live Real-Time Connected</strong> (All 4 Modules Synced) · Operator:{' '}
                <strong className="text-white">{userProfile?.displayName || user.email}</strong> [
                {userProfile?.role || 'Staff'}]
              </span>
            ) : (
              <span className="text-slate-400">
                Hospital Cloud Database: <strong className="text-slate-300">Public Live Feeds Active</strong> · Sign in to enable instant real-time mutations and EHR writes.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <button
                onClick={() => seedAllHospitalCollections()}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                title="Reseed all database collections with baseline datasets"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reseed Cloud Data</span>
              </button>
            )}

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
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <Module1Overview
            overviewMetrics={overviewMetrics}
            patients={patients}
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
            diseaseReports={diseaseReports}
            doctors={doctors}
            onAssignDoctorToIntake={handleAssignDoctorToIntake}
            onUpdateDoctorStatus={handleUpdateDoctorStatus}
            onAddDiseaseCase={handleAddDiseaseCase}
          />
        )}

        {activeTab === 'hologram' && (
          <Module4HologramRisk
            patients={patients}
            riskParts={riskParts}
            onSelectPatient={handleSelectPatientFromHologram}
            onUpdateRiskPart={handleUpdateRiskPart}
          />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal />

      {/* Clinical Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Aegis Medical Center & Health Network</span>
            <span>·</span>
            <span>Hospital Telemetry & Diagnostic Suite</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Database: Firestore Live Sync</span>
            <span>·</span>
            <span>HIPAA Compliant EHR</span>
            <span>·</span>
            <span>Hologram HUD v2.6</span>
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
