import { db } from "@/firebase/config";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  serverTimestamp
} from "firebase/firestore";
import { sendEmergencyReminder } from "./notificationService";
import { getPatientProfile } from "./profileService";
import type { IntelligenceLog, CrisisEvent, CrisisType, Severity, ScheduledTask } from "@/types";

/**
 * Adds a new thought/log to the AI Intelligence Feed
 */
export async function addIntelligenceLog(log: Omit<IntelligenceLog, "id" | "timestamp">) {
  try {
    const docRef = await addDoc(collection(db, "intelligence_logs"), {
      ...log,
      timestamp: Date.now(),
      serverTimestamp: serverTimestamp(),
    });
    return docRef.id;
  } catch (e) {
    console.error("Error adding intelligence log:", e);
    return null;
  }
}

/**
 * Subscribes to live intelligence logs for a specific case or crisis
 */
export function subscribeToIntelligenceLogs(
  targetId: string, 
  type: "case" | "crisis", 
  callback: (logs: IntelligenceLog[]) => void
) {
  const field = type === "case" ? "caseId" : "crisisId";
  const q = query(
    collection(db, "intelligence_logs"),
    where(field, "==", targetId),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IntelligenceLog[];
    callback(logs);
  });
}

/**
 * Subscribes to ALL city-wide intelligence logs (for the Command Center)
 */
export function subscribeToAllIntelligence(callback: (logs: IntelligenceLog[]) => void) {
  const q = query(
    collection(db, "intelligence_logs"),
    orderBy("timestamp", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as IntelligenceLog[];
    callback(logs);
  });
}

/**
 * MOCK: Simulates signal fusion and crisis detection
 * In a real app, this would be triggered by a Cloud Function or a background worker
 */
export async function detectCrisis(caseId: string, lat: number, lng: number) {
  // 1. Log the initiation of signal fusion
  await addIntelligenceLog({
    caseId,
    agentName: "IntelAgent",
    thought: "New emergency signal received. Initiating multi-source signal fusion...",
    confidence: 1.0
  });

  // 2. Simulate checking other sources
  setTimeout(async () => {
    await addIntelligenceLog({
      caseId,
      agentName: "IntelAgent",
      thought: "Checking social media feeds and weather sensors for Sector G-10...",
      confidence: 0.9
    });
    
    // Simulate finding a correlation
    setTimeout(async () => {
      await addIntelligenceLog({
        caseId,
        agentName: "IntelAgent",
        thought: "ALERT: Found 12 related social media posts reporting 'Urban Flooding' in this radius. Correlating with weather alert: 'Heavy Rain'.",
        confidence: 0.85,
        action: "CLUSTER_DETECTED"
      });
      
      await addIntelligenceLog({
        caseId,
        agentName: "Orchestrator",
        thought: "Incident upgraded to 'Probable Urban Flood'. Transitioning from isolated case to Crisis Event orchestration.",
        confidence: 0.9,
        action: "CRISIS_UPGRADE"
      });

      // 3. Initiate logistics search
      await findNearbyDoctors(lat, lng);
    }, 2000);
  }, 1500);
}

/**
 * Continuity Agent: Schedules and sends medication reminders
 */
export async function scheduleMedicineReminders(
  phone: string, 
  medDetails: { name: string; dosage: string; frequency: string; purpose?: string }
) {
  // 1. Log the Agent's reasoning
  await addIntelligenceLog({
    agentName: "StrategistAgent",
    thought: `Analyzing doctor's prescription for ${phone}. Medicine: ${medDetails.name}. Parsing schedule: "${medDetails.frequency}"`,
    confidence: 1.0
  });

  // 2. Extract Time from frequency string (e.g. "Take at 11 : 00 PM")
  let scheduledTime: number | null = null;
  // Improved regex to handle spaces: "10 : 58 PM", "10:58PM", "10 :58pm" etc.
  const timeMatch = medDetails.frequency.match(/(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM)/i);
  
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const ampm = timeMatch[3].toUpperCase();
    
    const now = new Date();
    const scheduledDate = new Date();
    let finalHours = ampm === "PM" && hours < 12 ? hours + 12 : hours;
    if (ampm === "AM" && hours === 12) finalHours = 0;
    
    scheduledDate.setHours(finalHours, minutes, 0, 0);
    
    // If time already passed today, schedule for tomorrow
    if (scheduledDate.getTime() < now.getTime()) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }
    scheduledTime = scheduledDate.getTime();
  }

  // 3. Log parsing result
  if (scheduledTime) {
    const timeStr = new Date(scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    await addIntelligenceLog({
      agentName: "StrategistAgent",
      thought: `Time extraction successful: Detected ${timeStr}. Queuing autonomous task in CIRO Temporal Buffer.`,
      confidence: 1.0,
      action: "TASK_QUEUED"
    });

    // 4. Save to Scheduled Tasks collection
    try {
      const profile = await getPatientProfile(phone);
      await addDoc(collection(db, "scheduled_tasks"), {
        type: "medication_reminder",
        targetPhone: phone,
        targetEmail: profile?.email || null,
        data: medDetails,
        scheduledFor: scheduledTime,
        status: "pending",
        createdAt: Date.now()
      });
    } catch (e) {
      console.error("Failed to queue task:", e);
    }
  } else {
    // Fallback: If no time detected, send a courtesy reminder immediately for demo
    await addIntelligenceLog({
      agentName: "StrategistAgent",
      thought: `No specific time detected in "${medDetails.frequency}". Defaulting to immediate 'General Adherence' reminder.`,
      confidence: 0.8
    });
    
    const profile = await getPatientProfile(phone);
    const patientEmail = profile?.email || "patient-demo@example.com"; 
    await sendEmergencyReminder(phone, patientEmail, medDetails);
    
    await addIntelligenceLog({
      agentName: "Orchestrator",
      thought: "Courtesy reminder dispatched. Continuity loop completed.",
      confidence: 1.0,
      action: "NOTIFICATION_SENT"
    });
  }
}

/**
 * Executes a pending task
 */
export async function executeScheduledTask(taskId: string) {
  try {
    const taskRef = doc(db, "scheduled_tasks", taskId);
    await updateDoc(taskRef, { status: "executed", executedAt: Date.now() });
    return true;
  } catch (e) {
    console.error("Task execution failed:", e);
    return false;
  }
}

/**
 * Subscribes to pending tasks
 */
export function subscribeToScheduledTasks(callback: (tasks: ScheduledTask[]) => void) {
  const q = query(
    collection(db, "scheduled_tasks"),
    where("status", "==", "pending"),
    orderBy("scheduledFor", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ScheduledTask[];
    callback(tasks);
  });
}

/**
 * Logistics Agent: Searches for nearby doctors and resources
 */
export async function findNearbyDoctors(lat: number, lng: number) {
  await addIntelligenceLog({
    agentName: "LogisticsAgent",
    thought: `Identifying patient coordinates: [${lat.toFixed(4)}, ${lng.toFixed(4)}]. Initiating search for nearest medical professionals...`,
    confidence: 1.0
  });

  setTimeout(async () => {
    // Mock doctor search result
    const nearby = [
      { name: "Dr. Ahmed", distance: "0.8km", special: "ER Specialist" },
      { name: "Dr. Fatima", distance: "1.2km", special: "General Physician" }
    ];

    await addIntelligenceLog({
      agentName: "LogisticsAgent",
      thought: `Search complete. Found ${nearby.length} doctors within 2km radius.`,
      confidence: 0.95
    });

    setTimeout(async () => {
      await addIntelligenceLog({
        agentName: "Orchestrator",
        thought: `Alerting ${nearby[0].name} (${nearby[0].special}) regarding new high-severity case.`,
        confidence: 0.9,
        action: "DOCTOR_ALERTED"
      });
    }, 1500);
  }, 2000);
}
