// ============================================
// Case Management Service (Firestore)
// NO composite indexes — all filtering client-side
// ============================================

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/firebase/config";
import type { PatientCase, CaseStatus } from "@/types";

const CASES_COLLECTION = "cases";

export async function createCase(
  caseData: Omit<PatientCase, "id" | "createdAt">
): Promise<string> {
  const docRef = await addDoc(collection(db, CASES_COLLECTION), {
    ...caseData,
    createdAt: Date.now(),
  });
  console.log("✅ Case created:", docRef.id);
  return docRef.id;
}

export async function getCase(caseId: string): Promise<PatientCase | null> {
  const snap = await getDoc(doc(db, CASES_COLLECTION, caseId));
  if (snap.exists()) return { id: snap.id, ...snap.data() } as PatientCase;
  return null;
}

export async function getAllCases(): Promise<PatientCase[]> {
  const snap = await getDocs(collection(db, CASES_COLLECTION));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as PatientCase))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function getCasesByPhone(phone: string): Promise<PatientCase[]> {
  const snap = await getDocs(collection(db, CASES_COLLECTION));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as PatientCase))
    .filter((c) => c.patientPhone === phone)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

// MUST actually write to Firestore — not a console.log stub
export async function updateCaseStatus(
  caseId: string,
  status: CaseStatus
): Promise<void> {
  const caseRef = doc(db, CASES_COLLECTION, caseId);
  await updateDoc(caseRef, { status, updatedAt: Date.now() });
  console.log("✅ Status updated:", caseId, "→", status);
}

export async function updateCase(
  caseId: string,
  updates: Partial<PatientCase>
): Promise<void> {
  await updateDoc(doc(db, CASES_COLLECTION, caseId), {
    ...updates,
    updatedAt: Date.now(),
  });
}

export async function deleteCase(caseId: string): Promise<void> {
  await deleteDoc(doc(db, CASES_COLLECTION, caseId));
}

// NO where(), NO orderBy() → avoids composite index requirement
// All filtering and sorting done CLIENT-SIDE
export function subscribeToAllCases(
  callback: (cases: PatientCase[]) => void
): () => void {
  const q = query(collection(db, CASES_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PatientCase)
      );
      const sorted = all.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(sorted);
    },
    (error) => {
      console.error("❌ Listener error:", error);
      callback([]);
    }
  );
}

export function subscribeToCasesByPhone(
  phone: string,
  callback: (cases: PatientCase[]) => void
): () => void {
  const q = query(collection(db, CASES_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const all = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PatientCase)
      );
      const filtered = all
        .filter((c) => c.patientPhone === phone)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(filtered);
    },
    (error) => {
      console.error("❌ Listener error:", error);
      callback([]);
    }
  );
}

export async function uploadCaseImage(file: File): Promise<string> {
  const filename = `case-images/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, filename);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  console.log("✅ Image uploaded:", url);
  return url;
}
