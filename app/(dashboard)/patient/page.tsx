"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  FileText,
  Clock,
  AlertTriangle,
  Send,
  History,
  ShieldAlert,
} from "lucide-react";
import { PatientForm } from "@/components/patient/PatientForm";
import { PatientHistory } from "@/components/patient/PatientHistory";
import { MedicalHistoryTab } from "@/components/patient/MedicalHistoryTab";
import { ActiveEmergencyAlert, ActiveCaseChat } from "@/components/patient/ActiveCasePanel";
import { SituationalAdvice } from "@/components/patient/SituationalAdvice";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { subscribeToCasesByPhone } from "@/services/caseService";
import { subscribeToChatMessages } from "@/services/chatService";
import { getPatientProfile } from "@/services/profileService";
import type { PatientCase, PatientProfile, ChatMessage } from "@/types";

type Tab = "report" | "history" | "medical";

export default function PatientPage() {
  const [activeTab, setActiveTab] = useState<Tab>("report");
  const [phone, setPhone] = useState("");
  const [lastCaseId, setLastCaseId] = useState<string | null>(null);
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);

  // Load phone from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("medilink_phone");
    if (saved) setPhone(saved);

    // Listen for phone changes from PatientForm
    const handleStorage = () => {
      const p = localStorage.getItem("medilink_phone");
      if (p) setPhone(p);
    };
    window.addEventListener("storage", handleStorage);

    // Poll for local changes (same-tab updates)
    const interval = setInterval(() => {
      const p = localStorage.getItem("medilink_phone");
      if (p && p !== phone) setPhone(p);
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, [phone]);

  // Subscribe to profile for reminders
  useEffect(() => {
    if (!phone.trim()) return;
    const loadProfile = async () => {
      const p = await getPatientProfile(phone.trim());
      setProfile(p);
    };
    loadProfile();
    const interval = setInterval(loadProfile, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [phone]);

  // Subscribe to cases
  useEffect(() => {
    if (!phone.trim()) {
      setCases([]);
      return;
    }
    const unsub = subscribeToCasesByPhone(phone.trim(), (data) => setCases(data));
    return () => unsub();
  }, [phone]);

  const activeCase = cases.find(c => ["pending", "assigned", "in-progress", "dispatched", "arrived"].includes(c.status));

  // Subscribe to active case messages
  useEffect(() => {
    if (!activeCase?.id) {
      setActiveMessages([]);
      return;
    }
    const unsub = subscribeToChatMessages(activeCase.id, (msgs) => {
      setActiveMessages(msgs);
    });
    return () => unsub();
  }, [activeCase?.id]);

  const hasDoctorMessage = activeMessages.some(m => m.senderRole === "doctor" || m.senderRole === "emergency");
  const isAnalyzed = activeCase && activeCase.status !== "pending";

  const handleCaseSubmitted = (caseId: string) => {
    setLastCaseId(caseId);
  };

  return (
    <div className={cn("mx-auto space-y-5 transition-all duration-500", hasDoctorMessage && activeTab === "report" ? "max-w-6xl" : "max-w-xl")}>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Heart size={22} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Emergency Portal</h1>
            <p className="text-xs text-slate-500">Report & track emergencies</p>
          </div>
        </div>
        <Badge variant="info" className="px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse mr-1.5" />
          Active
        </Badge>
      </motion.div>

      {/* Medication Reminders */}
      <AnimatePresence>
        {profile?.currentMedications.some(m => m.remainingDoses < 5) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <div className="p-1.5 rounded-lg bg-red-500/20 text-red-500 animate-bounce">
              <ShieldAlert size={16} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold text-red-600 dark:text-red-400">MEDICATION REFILL REQUIRED</p>
              <p className="text-[10px] text-slate-500 italic">
                You have less than 5 doses remaining for your active prescriptions. Please contact your doctor.
              </p>
            </div>
            <button onClick={() => setActiveTab("medical")} className="px-3 py-1 rounded-lg bg-red-500 text-white text-[10px] font-bold">
              View Profile
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Switcher */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 max-w-xl mx-auto"
      >
        <button
          type="button"
          onClick={() => setActiveTab("report")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === "report"
              ? "bg-red-500/15 text-red-400 border border-red-500/25 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800/50"
          )}
        >
          <Send size={15} />
          Report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === "history"
              ? "bg-blue-500/15 text-blue-400 border border-blue-500/25 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800/50"
          )}
        >
          <History size={15} />
          History
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("medical")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            activeTab === "medical"
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800/50"
          )}
        >
          <FileText size={15} />
          Profile
        </button>
      </motion.div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: activeTab === "report" ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "report" ? (
          <div className="space-y-4">
            <div className="max-w-xl mx-auto space-y-4">
              {/* Approved Medicine — only after approval */}
              {isAnalyzed && activeCase && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                      <ShieldAlert size={16} />
                    </div>
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">Approved Medical Protocol</h3>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 mb-3">{activeCase.aiSummary}</p>
                  <div className="space-y-2">
                    {activeCase.aiSuggestions?.filter(s => s.includes("—")).map((med, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                        <span className="text-purple-500">💊</span>
                        {med}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 backdrop-blur-sm p-5">
                <div className="flex items-center gap-2 mb-5">
                  <AlertTriangle size={16} className="text-red-400" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Emergency Case Submission</h2>
                </div>
                <PatientForm onCaseSubmitted={handleCaseSubmitted} />
              </div>
            </div>
          </div>
        ) : activeTab === "history" ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 backdrop-blur-sm p-5">
            <div className="flex items-center gap-2 mb-5">
              <Clock size={16} className="text-blue-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Your Cases</h2>
              {phone && (
                <span className="ml-auto text-[10px] text-slate-600 font-mono">{phone}</span>
              )}
            </div>
            <PatientHistory phone={phone} />
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 backdrop-blur-sm p-5">
            <div className="flex items-center gap-2 mb-5">
              <ShieldAlert size={16} className="text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Medical Profile & Safety</h2>
              {phone && (
                <span className="ml-auto text-[10px] text-slate-600 font-mono">{phone}</span>
              )}
            </div>
            <MedicalHistoryTab phone={phone} />
          </div>
        )}
      </motion.div>

      {/* Last submission indicator */}
      {lastCaseId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center"
        >
          <p className="text-[11px] text-emerald-400">
            ✓ Last case submitted · ID: {lastCaseId.slice(0, 8)}...
          </p>
        </motion.div>
      )}
    </div>
  );
}
