"use client";

import { useState } from "react";
import { 
  ShieldAlert, 
  UserCircle, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Pill, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PatientCase, Medication } from "@/types";
import { Badge } from "@/components/ui/badge";
import { addPrescriptionToHistory } from "@/services/profileService";

export function PatientSafetyPanel({ caseData }: { caseData: PatientCase | null }) {
  const [prescribing, setPrescribing] = useState(false);
  const [medName, setMedName] = useState("");
  const [dose, setDose] = useState("");
  const [freq, setFreq] = useState("");
  const [loading, setLoading] = useState(false);

  if (!caseData) return (
    <div className="h-full flex items-center justify-center text-slate-500 italic text-xs">
      Select a case to view safety metrics
    </div>
  );

  const handleAddMed = async () => {
    if (!medName || !dose || !caseData.patientPhone) return;
    setLoading(true);
    try {
      await addPrescriptionToHistory(caseData.patientPhone, {
        name: medName,
        dosage: dose,
        frequency: freq,
        prescribedBy: "Dr. Physician",
        remainingDoses: 30, // Default for hackathon
        totalDoses: 30,
        startDate: Date.now(),
      });
      setMedName("");
      setDose("");
      setFreq("");
      setPrescribing(false);
      alert("Medication added to patient history.");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const hasAlerts = caseData.safetyAlerts && caseData.safetyAlerts.length > 0;
  const history = caseData.medicalHistorySnapshot;

  return (
    <div className="space-y-4">
      {/* 1. AI Safety Warnings */}
      <div className={cn(
        "p-4 rounded-xl border transition-all",
        hasAlerts 
          ? "bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/5 animate-pulse" 
          : "bg-emerald-500/5 border-emerald-500/20"
      )}>
        <div className="flex items-center gap-2 mb-3">
          {hasAlerts ? <ShieldAlert size={18} className="text-red-500" /> : <ShieldCheck size={18} className="text-emerald-500" />}
          <h3 className={cn("text-sm font-bold", hasAlerts ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400")}>
            {hasAlerts ? "CRITICAL SAFETY ALERTS" : "Safety Check Passed"}
          </h3>
        </div>
        
        {hasAlerts ? (
          <ul className="space-y-2">
            {caseData.safetyAlerts?.map((alert, i) => (
              <li key={i} className="text-xs font-medium text-red-800 dark:text-red-200 flex items-start gap-2 bg-white/50 dark:bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {alert}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 italic">
            AI has analyzed patient history and found no immediate contraindications for standard triage.
          </p>
        )}
      </div>

      {/* 2. Patient History Snapshot */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <UserCircle size={16} className="text-blue-500" />
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Medical Context</h3>
        </div>

        {history ? (
          <div className="space-y-3">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Known Allergies</p>
              <div className="flex flex-wrap gap-1.5">
                {history.allergies.length > 0 ? history.allergies.map((a, i) => (
                  <Badge key={i} variant="destructive" className="text-[9px] px-1.5 py-0">
                    {a}
                  </Badge>
                )) : <span className="text-[10px] text-slate-400 italic">None reported</span>}
              </div>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Conditions</p>
              <div className="flex flex-wrap gap-1.5">
                {history.conditions.length > 0 ? history.conditions.map((c, i) => (
                  <Badge key={i} variant="outline" className="text-[9px] px-1.5 py-0 border-blue-500/30 text-blue-500">
                    {c}
                  </Badge>
                )) : <span className="text-[10px] text-slate-400 italic">None reported</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2 px-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-[10px] text-slate-500 italic">No medical history shared for this case.</p>
          </div>
        )}
      </div>

      {/* 3. Add to Prescription History */}
      <div className="pt-2">
        {!prescribing ? (
          <button 
            onClick={() => setPrescribing(true)}
            className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all"
          >
            <Pill size={14} />
            ADD TO PATIENT HISTORY
          </button>
        ) : (
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold text-emerald-600 uppercase">New Prescription</h4>
              <button onClick={() => setPrescribing(false)} className="text-[10px] text-slate-500 hover:text-slate-700">Cancel</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="Medicine"
                className="text-[11px] p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
              <input 
                value={dose}
                onChange={(e) => setDose(e.target.value)}
                placeholder="Dose (e.g. 500mg)"
                className="text-[11px] p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <input 
              value={freq}
              onChange={(e) => setFreq(e.target.value)}
              placeholder="Frequency (e.g. Twice Daily)"
              className="w-full text-[11px] p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
            <button 
              onClick={handleAddMed}
              disabled={loading || !medName}
              className="w-full py-2 rounded-lg bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-2"
            >
              {loading ? <ArrowRight className="animate-spin" size={12} /> : <CheckCircle size={12} />}
              CONFIRM & SYNC
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
