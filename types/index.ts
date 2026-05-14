// ============================================
// MediLink Type Definitions
// ============================================

export type Severity = "critical" | "high" | "medium" | "low";
export type CaseStatus = "pending" | "assigned" | "in-progress" | "dispatched" | "arrived" | "resolved" | "completed" | "closed";
export type UserRole = "patient" | "doctor" | "emergency";
export type Language = "english" | "urdu" | "pashto";

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
  accuracy?: number;
  timestamp: number;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: number;
  endDate?: number;
  prescribedBy: string;
  remainingDoses: number;
  totalDoses: number;
}

export interface PatientProfile {
  phone: string;
  name?: string;
  allergies: string[];
  chronicConditions: string[];
  bloodGroup?: string;
  currentMedications: Medication[];
  pastMedicalRecords: string[]; // URLs to uploaded documents
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}

export interface PatientCase {
  id: string;
  patientPhone: string;
  patientName?: string;
  language: Language;
  issueText: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  severity: Severity;
  aiSummary: string;
  aiSuggestions: string[];
  situationalSuggestions?: string[]; // New: First aid/immediate actions
  emergencyRequired: boolean;
  status: CaseStatus;
  address?: string;
  nearbyLandmarks?: string[];
  assignedDoctorId?: string;
  protocolApproved?: boolean;
  createdAt: number;
  updatedAt?: number;
  // New fields for medical safety
  medicalHistorySnapshot?: {
    allergies: string[];
    conditions: string[];
  };
  safetyAlerts?: string[]; // AI-generated warnings (e.g., "Allergic to Penicillin")
}

export interface AIAnalysis {
  possibleConditions: string[];
  recommendedActions: string[];
  situationalSuggestions?: string[]; // New: First aid/immediate actions
  triageLevel: Severity;
  confidence: number;
  summary: string;
  requiresImmediate: boolean;
  safetyWarnings?: string[]; // New: AI flags allergies or contraindications
}

export interface ChatMessage {
  id: string;
  caseId: string;
  senderId: string;
  senderRole: UserRole;
  senderName: string;
  message: string;
  timestamp: number;
}

export interface DispatchInfo {
  caseId: string;
  ambulanceId?: string;
  dispatchedAt: number;
  estimatedArrival?: number;
  status: "dispatched" | "en-route" | "arrived" | "completed";
  notes?: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  role: UserRole;
  description?: string;
}
