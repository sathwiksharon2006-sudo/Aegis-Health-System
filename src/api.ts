import { Patient, VisitRecord, TriageLevel, PatientStatus } from './types/hospital';

const API_BASE_URL = 'http://127.0.0.1:5000';

interface MySQLVisit {
  visit_id: number;
  visit_date: string | null;
  visit_type: string | null;
  symptoms: string | null;
  notes: string | null;
  doctor_name: string | null;
  specialization: string | null;
  department: string | null;
}

interface MySQLPatient {
  patient_id: number;
  patient_name: string;
  date_of_birth: string | null;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  address: string;
  blood_group: Patient['bloodGroup'];
  visits: MySQLVisit[];
}

interface PatientsResponse {
  status: string;
  count: number;
  patients: MySQLPatient[];
}

function calculateAge(dateOfBirth: string | null): number {
  if (!dateOfBirth) {
    return 0;
  }

  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function mapVisit(
  visit: MySQLVisit,
  index: number
): VisitRecord {
  const visitDate = visit.visit_date
    ? new Date(visit.visit_date)
    : new Date();

  const date = visitDate.toISOString().split('T')[0];

  const time = visitDate.toTimeString().slice(0, 5);

  const triageLevel: TriageLevel =
    visit.visit_type === 'Follow-up'
      ? 'Routine'
      : 'Urgent';

  const status: PatientStatus =
    visit.visit_type === 'Follow-up'
      ? 'Observation'
      : 'Checked In';

  return {
    visitId: String(visit.visit_id),
    visitNumber: index + 1,
    isFirstVisit: index === 0,
    date,
    time,
    department: visit.department || 'General Medicine',
    attendingDoctor: visit.doctor_name || 'Not Assigned',
    chiefComplaint: visit.symptoms || 'Not provided',

    vitals: {
      bloodPressure: 'Not recorded',
      heartRate: 0,
      spo2: 0,
      temperature: 0,
      weight: 0
    },

    triageLevel,
    diagnosis: visit.symptoms || 'Not recorded',
    prescription: [],
    clinicalNotes: visit.notes || 'No clinical notes available.',
    status
  };
}

function mapPatient(patient: MySQLPatient): Patient {
  const visits = patient.visits || [];

  return {
    id: `PT-${String(patient.patient_id).padStart(4, '0')}`,
    nationalId: `MYSQL-${patient.patient_id}`,
    fullName: patient.patient_name,
    age: calculateAge(patient.date_of_birth),
    dob: patient.date_of_birth || '',
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email,
    address: patient.address,
    bloodGroup: patient.blood_group,

    allergies: [],
    chronicConditions: [],

    emergencyContact: {
      name: 'Not provided',
      relationship: 'Not provided',
      phone: 'Not provided'
    },

    registrationDate: visits.length > 0
      ? visits[visits.length - 1].visit_date?.split(' ')[0] || ''
      : '',

    visitCount: visits.length,

    visits: visits.map((visit, index) =>
      mapVisit(visit, index)
    )
  };
}

export async function getPatients(): Promise<{
  status: string;
  count: number;
  patients: Patient[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/patients`);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch patients: ${response.status}`
    );
  }

  const data: PatientsResponse = await response.json();

  return {
    status: data.status,
    count: data.count,
    patients: data.patients.map(mapPatient)
  };
}
