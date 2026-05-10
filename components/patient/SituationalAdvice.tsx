"use client";

import { motion } from "framer-motion";
import { Activity, ShieldAlert, CheckCircle2 } from "lucide-react";
import type { PatientCase } from "@/types";

export function SituationalAdvice({ caseData }: { caseData: PatientCase }) {
  const situational = caseData.situationalSuggestions || [];
  const otherActions = (caseData.aiSuggestions || []).filter(s => !s.includes("—"));
  
  // Merge unique suggestions
  const allGuidance = Array.from(new Set([...situational, ...otherActions]));
  
  if (allGuidance.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-5 rounded-2xl border-2 border-blue-500/20 bg-blue-500/5 shadow-xl shadow-blue-500/5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-blue-500/20 text-blue-500">
          <Activity size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">AI Emergency Guidance</h3>
          <p className="text-[10px] text-slate-500 italic">Analyzed based on your {caseData.imageUrl ? "image & " : ""}report</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {allGuidance.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-blue-500/10 shadow-sm"
          >
            <div className="mt-0.5">
              <CheckCircle2 size={14} className="text-blue-500" />
            </div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
              {s}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-blue-500/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={12} className="text-blue-400 animate-pulse" />
          <span className="text-[9px] font-bold text-blue-500/60 uppercase tracking-tighter">Verified Protocol Pending Dr Review</span>
        </div>
        <p className="text-[9px] text-slate-500 italic">Stay calm. Analysis Complete.</p>
      </div>
    </motion.div>
  );
}
