import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  INITIAL_PATIENTS,
  DOCTORS_ROSTER,
  DISEASE_REPORTS,
  ANATOMICAL_RISK_PARTS,
  VISIT_OVERVIEW_METRICS,
} from '../src/data/mockHospitalData';

async function seed() {
  console.log('Reading config...');
  const configPath = resolve(process.cwd(), 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(readFileSync(configPath, 'utf8'));

  console.log(`Target Firebase Project: ${firebaseConfig.projectId}`);
  console.log(`Target Firestore DB: ${firebaseConfig.firestoreDatabaseId}`);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  console.log('\n--- 1. Seeding Patients ---');
  for (const patient of INITIAL_PATIENTS) {
    const patientRef = doc(db, 'patients', patient.id);
    await setDoc(patientRef, {
      ...patient,
      createdBy: 'system_bootstrap',
      updatedAt: new Date().toISOString(),
    });
    console.log(`Saved Patient: ${patient.id} - ${patient.fullName}`);
  }

  console.log('\n--- 2. Seeding Doctors Roster ---');
  for (const doctor of DOCTORS_ROSTER) {
    const docRef = doc(db, 'doctors', doctor.id);
    await setDoc(docRef, {
      ...doctor,
      updatedAt: new Date().toISOString(),
    });
    console.log(`Saved Doctor: ${doctor.id} - ${doctor.name}`);
  }

  console.log('\n--- 3. Seeding Disease Reports ---');
  for (const disease of DISEASE_REPORTS) {
    const diseaseRef = doc(db, 'disease_reports', disease.id);
    await setDoc(diseaseRef, {
      ...disease,
      updatedAt: new Date().toISOString(),
    });
    console.log(`Saved Disease: ${disease.id} - ${disease.name}`);
  }

  console.log('\n--- 4. Seeding Anatomical Hologram Risks ---');
  for (const part of ANATOMICAL_RISK_PARTS) {
    const riskRef = doc(db, 'anatomical_risks', part.id);
    await setDoc(riskRef, {
      ...part,
      updatedAt: new Date().toISOString(),
    });
    console.log(`Saved Risk Part: ${part.id} - ${part.name}`);
  }

  console.log('\n--- 5. Seeding Hospital Overview Metrics ---');
  const metricsRef = doc(db, 'overview_metrics', 'hospital_telemetry_live');
  await setDoc(metricsRef, {
    id: 'hospital_telemetry_live',
    ...VISIT_OVERVIEW_METRICS,
    lastUpdated: new Date().toISOString(),
  });
  console.log('Saved Overview Metrics: hospital_telemetry_live');

  console.log('\nSUCCESS! All hospital collections seeded directly into Firestore!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
