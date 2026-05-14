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
  MapPin,
  Sparkles,
  X,
} from "lucide-react";
import { PatientForm } from "@/components/patient/PatientForm";
import { PatientHistory, CaseChat } from "@/components/patient/PatientHistory";
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
  const [isPanelClosed, setIsPanelClosed] = useState(false);

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

  // Load panel state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("medilink_panel_closed");
    if (saved === "true") setIsPanelClosed(true);
  }, []);

  const setPanelClosed = (closed: boolean) => {
    setIsPanelClosed(closed);
    localStorage.setItem("medilink_panel_closed", closed.toString());
  };

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

  const activeCase = cases[0]; // Get the most recent case regardless of status to stay in sync with history

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
    setPanelClosed(false);
  };

  const showActiveCase = activeCase && !isPanelClosed && activeTab === "report";

  return (
    <div className={cn("mx-auto space-y-5 transition-all duration-500", showActiveCase ? "max-w-6xl" : "max-w-xl")}>
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
          <div className={cn("transition-all duration-500", showActiveCase ? "grid grid-cols-1 lg:grid-cols-12 gap-6" : "max-w-xl mx-auto space-y-4")}>
            <div className={cn("space-y-4", showActiveCase ? "lg:col-span-5" : "")}>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 backdrop-blur-sm p-5">
                <div className="flex items-center gap-2 mb-5">
                  <AlertTriangle size={16} className="text-red-400" />
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Emergency Case Submission</h2>
                </div>
                <PatientForm onCaseSubmitted={handleCaseSubmitted} />
              </div>
            </div>

            {showActiveCase && (
              <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 p-5 relative">
                <button 
                  onClick={() => setPanelClosed(true)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors z-10"
                  title="Close panel"
                >
                  <X size={16} />
                </button>
                <div className="space-y-3">
                  <SituationalAdvice caseData={activeCase} />

                  {/* AI Summary & Medicines — only if EXPLICITLY approved by doctor */}
                  {!activeCase.protocolApproved ? (
                    <div className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50">
                      <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                        <Clock size={10} /> Pending Doctor Review
                      </p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                        Specific medicine recommendations will be visible once a doctor reviews and approves your case.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                      <p className="text-[10px] font-medium text-purple-400 mb-1 flex items-center gap-1">
                        <Sparkles size={10} /> Approved Medical Protocol
                      </p>
                      {activeCase.aiSummary && <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">{activeCase.aiSummary}</p>}
                      {activeCase.aiSuggestions?.filter((a) => a.includes("—")).length ? (
                        <ul className="space-y-1">
                          {activeCase.aiSuggestions.filter((a) => a.includes("—")).map((s, i) => (
                            <li key={i} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                              <span className="text-purple-400 mt-0.5">💊</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}

                  {/* Chat — only if assigned or further */}
                  {activeCase.status !== "pending" && (
                    <div className="mt-3">
                      <CaseChat caseId={activeCase.id} phone={phone} />
                    </div>
                  )}

                  {/* Image */}
                  {activeCase.imageUrl && (
                    <div className="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                      <img
                        src={activeCase.imageUrl}
                        alt="Case image"
                        className="w-full max-h-40 object-cover"
                      />
                    </div>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <MapPin size={10} />
                    {activeCase.latitude.toFixed(4)}, {activeCase.longitude.toFixed(4)}
                    {activeCase.accuracy > 0 && ` · ±${Math.round(activeCase.accuracy)}m`}
                  </div>
                </div>
              </div>
            )}
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
