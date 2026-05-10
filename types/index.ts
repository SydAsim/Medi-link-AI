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
  emergencyRequired: boolean;
  status: CaseStatus;
  assignedDoctorId?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface AIAnalysis {
  possibleConditions: string[];
  recommendedActions: string[];
  triageLevel: Severity;
  confidence: number;
  summary: string;
  requiresImmediate: boolean;
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
