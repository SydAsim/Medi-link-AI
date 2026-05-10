// ============================================
// Patient Profile & Medical History Service
// ============================================

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/config";
import type { PatientProfile, Medication } from "@/types";

const PROFILES_COLLECTION = "patient_profiles";

export async function getPatientProfile(phone: string): Promise<PatientProfile | null> {
  const snap = await getDoc(doc(db, PROFILES_COLLECTION, phone.trim()));
  if (snap.exists()) return snap.data() as PatientProfile;
  return null;
}

export async function updatePatientProfile(phone: string, updates: Partial<PatientProfile>): Promise<void> {
  const ref = doc(db, PROFILES_COLLECTION, phone.trim());
  const snap = await getDoc(ref);
  
  if (snap.exists()) {
    await updateDoc(ref, { ...updates, updatedAt: Date.now() });
  } else {
    await setDoc(ref, {
      phone,
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
      pastMedicalRecords: [],
      ...updates,
      createdAt: Date.now(),
    });
  }
}

export async function uploadMedicalRecord(phone: string, file: File): Promise<string> {
  const filename = `medical-records/${phone}/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  
  // Add to profile
  const profile = await getPatientProfile(phone);
  const records = profile?.pastMedicalRecords || [];
  await updatePatientProfile(phone, { pastMedicalRecords: [...records, url] });
  
  return url;
}

export async function addPrescriptionToHistory(phone: string, medication: Omit<Medication, "id">): Promise<void> {
  const profile = await getPatientProfile(phone);
  const meds = profile?.currentMedications || [];
  
  const newMed: Medication = {
    ...medication,
    id: Math.random().toString(36).slice(2, 9),
    startDate: Date.now(),
  };
  
  await updatePatientProfile(phone, { currentMedications: [...meds, newMed] });
}

export async function updateMedicationRemaining(phone: string, medId: string, remaining: number): Promise<void> {
  const profile = await getPatientProfile(phone);
  if (!profile) return;
  
  const meds = profile.currentMedications.map(m => 
    m.id === medId ? { ...m, remainingDoses: remaining } : m
  );
  
  await updatePatientProfile(phone, { currentMedications: meds });
}
