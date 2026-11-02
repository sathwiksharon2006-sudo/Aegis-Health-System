import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Patient,
  Doctor,
  DiseaseReport,
  AnatomicalRiskPart,
} from '../types/hospital';
import {
  INITIAL_PATIENTS,
  DOCTORS_ROSTER,
  DISEASE_REPORTS,
  ANATOMICAL_RISK_PARTS,
  VISIT_OVERVIEW_METRICS,
} from '../data/mockHospitalData';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// CRITICAL: getFirestore must pass firebaseConfig.firestoreDatabaseId per skill instructions
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling Specification from Firebase Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Mandatory testConnection function
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Please check your network connection.');
    }
  }
}

// User Profile model stored in /users/{userId}
export interface StaffUserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'Doctor' | 'Nurse' | 'Admin' | 'Staff';
  department: string;
  createdAt: string;
  updatedAt: string;
}

// Save or sync user profile in Firestore
export async function syncUserProfile(
  user: FirebaseUser,
  extraData?: { role?: string; department?: string; fullName?: string }
): Promise<StaffUserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  let existingProfile: StaffUserProfile | null = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      existingProfile = snap.data() as StaffUserProfile;
    }
  } catch (err) {
    // Non-fatal if initial record doesn't exist yet
  }

  const role = (extraData?.role as StaffUserProfile['role']) || existingProfile?.role || 'Doctor';
  const department = extraData?.department || existingProfile?.department || 'Cardiology & Critical Care';
  const displayName = extraData?.fullName || user.displayName || existingProfile?.displayName || user.email?.split('@')[0] || 'Medical Officer';

  const profile: StaffUserProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName,
    role,
    department,
    createdAt: existingProfile?.createdAt || now,
    updatedAt: now,
  };

  try {
    await setDoc(userRef, profile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }

  return profile;
}

// ==========================================
// 1. PATIENTS FIRESTORE OPERATIONS
// ==========================================
export async function savePatientToFirestore(patient: Patient) {
  const path = `patients/${patient.id}`;
  try {
    const patientRef = doc(db, 'patients', patient.id);
    await setDoc(patientRef, {
      ...patient,
      createdBy: auth.currentUser?.uid || 'system',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedInitialPatientsIfEmpty(existingCount: number) {
  if (existingCount > 0 || !auth.currentUser) return;
  try {
    for (const patient of INITIAL_PATIENTS) {
      await savePatientToFirestore(patient);
    }
  } catch (err) {
    console.warn('Seeding initial patients skipped:', err);
  }
}

// ==========================================
// 2. DOCTORS FIRESTORE OPERATIONS
// ==========================================
export async function saveDoctorToFirestore(doctor: Doctor) {
  const path = `doctors/${doctor.id}`;
  try {
    const docRef = doc(db, 'doctors', doctor.id);
    await setDoc(docRef, {
      ...doctor,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateDoctorStatusInFirestore(
  doctorId: string,
  newStatus: Doctor['status'],
  newQueueDelta?: number
) {
  const path = `doctors/${doctorId}`;
  try {
    const docRef = doc(db, 'doctors', doctorId);
    const updates: any = {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    if (typeof newQueueDelta === 'number') {
      updates.currentQueue = Math.max(0, newQueueDelta);
    }
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function seedInitialDoctorsIfEmpty(existingCount: number) {
  if (existingCount > 0 || !auth.currentUser) return;
  try {
    for (const docItem of DOCTORS_ROSTER) {
      await saveDoctorToFirestore(docItem);
    }
  } catch (err) {
    console.warn('Seeding initial doctors skipped:', err);
  }
}

// ==========================================
// 3. DISEASE REPORTS FIRESTORE OPERATIONS
// ==========================================
export async function saveDiseaseReportToFirestore(report: DiseaseReport) {
  const path = `disease_reports/${report.id}`;
  try {
    const docRef = doc(db, 'disease_reports', report.id);
    await setDoc(docRef, {
      ...report,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateDiseaseStatsInFirestore(
  diseaseId: string,
  updates: Partial<DiseaseReport>
) {
  const path = `disease_reports/${diseaseId}`;
  try {
    const docRef = doc(db, 'disease_reports', diseaseId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function seedInitialDiseaseReportsIfEmpty(existingCount: number) {
  if (existingCount > 0 || !auth.currentUser) return;
  try {
    for (const disease of DISEASE_REPORTS) {
      await saveDiseaseReportToFirestore(disease);
    }
  } catch (err) {
    console.warn('Seeding disease reports skipped:', err);
  }
}

// ==========================================
// 4. ANATOMICAL RISKS FIRESTORE OPERATIONS
// ==========================================
export async function saveAnatomicalRiskToFirestore(risk: AnatomicalRiskPart) {
  const path = `anatomical_risks/${risk.id}`;
  try {
    const docRef = doc(db, 'anatomical_risks', risk.id);
    await setDoc(docRef, {
      ...risk,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateAnatomicalRiskInFirestore(
  riskId: string,
  updates: Partial<AnatomicalRiskPart>
) {
  const path = `anatomical_risks/${riskId}`;
  try {
    const docRef = doc(db, 'anatomical_risks', riskId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function seedInitialAnatomicalRisksIfEmpty(existingCount: number) {
  if (existingCount > 0 || !auth.currentUser) return;
  try {
    for (const part of ANATOMICAL_RISK_PARTS) {
      await saveAnatomicalRiskToFirestore(part);
    }
  } catch (err) {
    console.warn('Seeding anatomical risks skipped:', err);
  }
}

// ==========================================
// 5. OVERVIEW METRICS FIRESTORE OPERATIONS
// ==========================================
export async function saveOverviewMetricsToFirestore(metrics: typeof VISIT_OVERVIEW_METRICS) {
  const path = 'overview_metrics/hospital_telemetry_live';
  try {
    const docRef = doc(db, 'overview_metrics', 'hospital_telemetry_live');
    await setDoc(docRef, {
      id: 'hospital_telemetry_live',
      ...metrics,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function seedInitialOverviewMetricsIfEmpty(existing: boolean) {
  if (existing || !auth.currentUser) return;
  try {
    await saveOverviewMetricsToFirestore(VISIT_OVERVIEW_METRICS);
  } catch (err) {
    console.warn('Seeding overview metrics skipped:', err);
  }
}

// Master seeder for all hospital collections
export async function seedAllHospitalCollections() {
  if (!auth.currentUser) return;
  try {
    for (const p of INITIAL_PATIENTS) {
      await savePatientToFirestore(p);
    }
    for (const d of DOCTORS_ROSTER) {
      await saveDoctorToFirestore(d);
    }
    for (const dis of DISEASE_REPORTS) {
      await saveDiseaseReportToFirestore(dis);
    }
    for (const r of ANATOMICAL_RISK_PARTS) {
      await saveAnatomicalRiskToFirestore(r);
    }
    await saveOverviewMetricsToFirestore(VISIT_OVERVIEW_METRICS);
  } catch (err) {
    console.error('Master seed error:', err);
  }
}
