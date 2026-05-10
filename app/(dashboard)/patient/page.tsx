"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Heart,
  FileText,
  Clock,
  AlertTriangle,
  Send,
  History,
} from "lucide-react";
import { PatientForm } from "@/components/patient/PatientForm";
import { PatientHistory } from "@/components/patient/PatientHistory";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Tab = "report" | "history";

export default function PatientPage() {
  const [activeTab, setActiveTab] = useState<Tab>("report");
  const [phone, setPhone] = useState("");
  const [lastCaseId, setLastCaseId] = useState<string | null>(null);

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

  const handleCaseSubmitted = (caseId: string) => {
    setLastCaseId(caseId);
    // Auto-switch to history after submission
    setTimeout(() => setActiveTab("history"), 2000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-5">
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

      {/* Tab Switcher — custom buttons per gotcha G */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50"
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
          id="tab-report"
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
          id="tab-history"
        >
          <History size={15} />
          History
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
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30 backdrop-blur-sm p-5">
            <div className="flex items-center gap-2 mb-5">
              <AlertTriangle size={16} className="text-red-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Emergency Case Submission</h2>
            </div>
            <PatientForm onCaseSubmitted={handleCaseSubmitted} />
          </div>
        ) : (
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
