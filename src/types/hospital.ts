export type TriageLevel = 'Routine' | 'Urgent' | 'Emergency';

export type PatientStatus = 'Checked In' | 'Under Care' | 'Observation' | 'Discharged';

export interface VitalSigns {
  bloodPressure: string; // e.g. "120/80"
  heartRate: number; // bpm
  spo2: number; // %
  temperature: number; // °F or °C
  weight: number; // kg
}

export interface VisitRecord {
  visitId: string;
  visitNumber: number;
  isFirstVisit: boolean;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  department: string;
  attendingDoctor: string;
  chiefComplaint: string;
  vitals: VitalSigns;
  triageLevel: TriageLevel;
  diagnosis: string;
  prescription: string[];
  clinicalNotes: string;
  status: PatientStatus;
  followUpDate?: string;
}

export interface Patient {
  id: string; // e.g. "PT-2026-0104"
  nationalId: string;
  fullName: string;
  age: number;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  allergies: string[];
  chronicConditions: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  registrationDate: string;
  visitCount: number; // 1 = first time, 2+ = returning
  visits: VisitRecord[];
  primaryRiskOrgan?: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  department: string;
  specialty: string;
  roomNumber: string;
  status: 'Available' | 'In Consultation' | 'In Surgery' | 'On Break' | 'Off Duty';
  currentQueue: number;
  avgWaitMins: number;
  shiftHours: string;
  contactExtension: string;
  experienceYears: number;
  rating: number;
}

export interface DiseaseReport {
  id: string;
  name: string;
  category: 'Cardiovascular' | 'Respiratory' | 'Infectious & Viral' | 'Endocrine & Metabolic' | 'Orthopedic' | 'Neurological' | 'Gastrointestinal' | 'Oncology';
  icd10: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  dailyCount: number;
  weeklyCount: number;
  monthlyCount: number;
  yearlyCount: number;
  activeCases: number;
  bedOccupancy: number;
  recoveryRate: number; // percentage
  mortalityRate: number; // percentage
  trendPercentage: number; // e.g. +4.5% or -2.1%
  primarySymptoms: string[];
  primaryDepartment: string;
}

export type RiskLevel = 'Critical' | 'High' | 'Moderate' | 'Normal';

export interface AnatomicalRiskPart {
  id: string; // e.g. "brain", "heart", "lungs", "liver", "kidneys", "gastrointestinal", "spine", "limbs"
  name: string;
  latinName: string;
  system: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  primaryIssue: string;
  description: string;
  vitalTelemetry: {
    label: string;
    value: string;
    status: 'normal' | 'warning' | 'alert';
    unit?: string;
  }[];
  affectedPatientCount: number;
  samplePatientIds: string[];
  pathologyRisks: string[];
  recommendedProtocol: string;
  svgCoordinates: {
    cx: number;
    cy: number;
    r: number;
  };
}

export type OverviewTimeframe = 'daily' | 'weekly' | 'yearly';
