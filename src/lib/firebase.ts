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
  getDocFromServer,
  setDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Patient } from '../types/hospital';
import { INITIAL_PATIENTS } from '../data/mockHospitalData';

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
export async function syncUserProfile(user: FirebaseUser, extraData?: { role?: string; department?: string; fullName?: string }): Promise<StaffUserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const now = new Date().toISOString();

  let existingProfile: StaffUserProfile | null = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      existingProfile = snap.data() as StaffUserProfile;
    }
  } catch (err) {
    // Non-fatal or permissions if not created yet
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

// Sync/Save a Patient to Firestore database
export async function savePatientToFirestore(patient: Patient) {
  const path = `patients/${patient.id}`;
  try {
    const patientRef = doc(db, 'patients', patient.id);
    await setDoc(patientRef, {
      ...patient,
      createdBy: auth.currentUser?.uid || 'staff-system',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// Seed Initial Patients if database collection is empty
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
