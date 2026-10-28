import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Module1Overview } from './components/Module1Overview';
import { Module2Patients } from './components/Module2Patients';
import { Module3DiseaseReports } from './components/Module3DiseaseReports';
import { Module4HologramRisk } from './components/Module4HologramRisk';
import { INITIAL_PATIENTS } from './data/mockHospitalData';
import { Patient, VisitRecord } from './types/hospital';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'diseases' | 'hologram'>('overview');

  // Patients Database in localStorage
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

  // Save to localStorage when patients change
  useEffect(() => {
    try {
      localStorage.setItem('aegis_hospital_patients_db', JSON.stringify(patients));
    } catch (e) {
      console.error('Error saving patients to storage', e);
    }
  }, [patients]);

  // Intake Modal open state
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState<boolean>(false);
  const [selectedPatientIdForDossier, setSelectedPatientIdForDossier] = useState<string | null>(null);

  // Add new patient (First-time visit)
  const handleSavePatient = (newPatient: Patient) => {
    setPatients((prev) => [newPatient, ...prev]);
  };

  // Record subsequent visit (Returning visit #2+)
  const handleRecordSubsequentVisit = (patientId: string, newVisit: VisitRecord) => {
    setPatients((prev) =>
      prev.map((patient) => {
        if (patient.id === patientId) {
          return {
            ...patient,
            visitCount: patient.visitCount + 1,
            visits: [...patient.visits, newVisit],
          };
        }
        return patient;
      })
    );
  };

  // Cross-module action: from Module 3 Doctor Roster -> assign doctor in intake
  const handleAssignDoctorToIntake = (doctorName: string, department: string) => {
    setActiveTab('patients');
    setIsIntakeModalOpen(true);
  };

  // Cross-module action: from Module 4 Hologram Scanner -> view patient dossier in Module 2
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

      {/* Clinical Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Aegis Medical Center & Health Network</span>
            <span>·</span>
            <span>Hospital Telemetry & Diagnostic Suite</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>Clinical Server: Operational</span>
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
