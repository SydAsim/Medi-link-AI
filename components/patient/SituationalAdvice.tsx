"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ShieldAlert,
  CheckCircle2,
  AlertOctagon,
  Heart,
  Languages,
  Stethoscope,
} from "lucide-react";
import type { PatientCase } from "@/types";

export function SituationalAdvice({ caseData }: { caseData: PatientCase }) {
  const firstAid = (caseData as any).recommendedFirstAid as string[] | undefined;
  const situational = caseData.situationalSuggestions || [];
  const redFlags = (caseData as any).redFlags as string[] | undefined;
  const safetyWarnings = caseData.safetyAlerts || [];
  const patientMessage = (caseData as any).patientMessage as string | undefined;
  const detectedLanguage = (caseData as any).detectedLanguage as string | undefined;
  const requiresImmediate = caseData.emergencyRequired;

  // Prefer firstAid if available, fallback to situational (old cases)
  const guidanceSteps = firstAid && firstAid.length > 0
    ? firstAid
    : situational.filter((s) => !s.includes("—"));

  const isSerious = caseData.severity === "critical" || caseData.severity === "high";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-2xl border-2 shadow-xl overflow-hidden ${
        isSerious
          ? "border-red-500/30 bg-red-500/5 shadow-red-500/10"
          : "border-blue-500/20 bg-blue-500/5 shadow-blue-500/5"
      }`}
    >
      {/* Header */}
      <div
        className={`px-5 py-4 flex items-center justify-between ${
          isSerious
            ? "bg-red-500/10 border-b border-red-500/20"
            : "bg-blue-500/10 border-b border-blue-500/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-xl ${
              isSerious ? "bg-red-500/20 text-red-600 dark:text-red-400" : "bg-blue-500/20 text-blue-600 dark:text-blue-550"
            }`}
          >
            {isSerious ? <AlertOctagon size={18} /> : <Activity size={18} />}
          </div>
          <div>
            <h3
              className={`text-sm font-bold uppercase tracking-wider ${
                isSerious ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
              }`}
            >
              {isSerious ? "⚠️ Emergency Guidance" : "AI Emergency Guidance"}
            </h3>
            <p className="text-[10px] text-slate-550 italic">
              Analyzed based on your {caseData.imageUrl ? "image & " : ""}report
              {detectedLanguage && detectedLanguage !== "unknown" && detectedLanguage !== "english" && (
                <span className="ml-1 inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400">
                  <Languages size={9} /> {detectedLanguage.replace("_", " ")}
                </span>
              )}
            </p>
          </div>
        </div>

        {requiresImmediate && (
          <span className="text-[9px] font-black bg-red-500 text-white px-2 py-1 rounded-lg animate-pulse uppercase tracking-wide">
            URGENT
          </span>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* AI Patient Message */}
        {patientMessage && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-blue-500/10 shadow-sm">
            <Heart size={14} className="mt-0.5 text-pink-500 dark:text-pink-400 flex-shrink-0" />
            <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              {patientMessage}
            </p>
          </div>
        )}

        {/* First Aid Steps */}
        {guidanceSteps.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-550 font-bold mb-2 flex items-center gap-1">
              <CheckCircle2 size={9} /> Immediate Steps
            </p>
            <div className="space-y-2">
              {guidanceSteps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900/50 border border-blue-500/10"
                >
                  <span className="mt-0.5 h-4 w-4 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[9px] font-black flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-xs font-medium text-slate-850 dark:text-slate-200 leading-relaxed">
                    {s}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Red Flags */}
        {redFlags && redFlags.length > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-red-650 dark:text-red-400 font-bold mb-2 flex items-center gap-1">
              <AlertOctagon size={9} /> Danger Signs — Seek Emergency Care If:
            </p>
            <div className="space-y-1.5">
              {redFlags.map((flag, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/15"
                >
                  <span className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0 text-xs">⚠</span>
                  <p className="text-[11px] text-red-800 dark:text-red-300 leading-relaxed font-medium">{flag}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Warnings */}
        {safetyWarnings.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20">
            <p className="text-[9px] uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold mb-2 flex items-center gap-1">
              <ShieldAlert size={9} /> Safety Notes
            </p>
            {safetyWarnings.map((w, i) => (
              <p key={i} className="text-[11px] text-amber-900 dark:text-amber-300/80 leading-relaxed font-medium">
                {w}
              </p>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-blue-500/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope size={11} className="text-blue-500 dark:text-blue-400 animate-pulse" />
            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-500/60 uppercase tracking-tighter">
              Pending Dr Review
            </span>
          </div>
          <p className="text-[9px] text-slate-600 dark:text-slate-500 italic">Stay calm. Help is coming.</p>
        </div>
      </div>
    </motion.div>
  );
}
