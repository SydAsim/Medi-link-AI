"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Pill, AlertTriangle, Activity, ChevronDown, ChevronUp, Sparkles, Edit2, CheckCircle, Loader2 } from "lucide-react";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateCase } from "@/services/caseService";
import type { PatientCase } from "@/types";

interface AIAnalysisPanelProps {
  caseData: PatientCase | null;
}

// Parse medicine string: split on " — " for structured display
function parseMedicine(med: string) {
  const parts = med.split(" — ").map((p) => p.trim());
  if (parts.length >= 3) {
    return { name: parts[0], details: parts.slice(1) };
  }
  return null;
}

export function AIAnalysisPanel({ caseData }: AIAnalysisPanelProps) {
  const [medsExpanded, setMedsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMeds, setEditedMeds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Sync edited meds when entering edit mode
  const startEditing = (medicines: string[]) => {
    setEditedMeds([...medicines]);
    setIsEditing(true);
  };

  const handleSaveMeds = async (otherActions: string[]) => {
    if (!caseData) return;
    setSaving(true);
    try {
      const updatedSuggestions = [...otherActions, ...editedMeds.filter(m => m.trim() !== "")];
      await updateCase(caseData.id, { aiSuggestions: updatedSuggestions });
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to save medicines", e);
    } finally {
      setSaving(false);
    }
  };

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Brain size={40} className="text-slate-700 mb-4" />
        <p className="text-sm text-slate-500">Select a case to view</p>
        <p className="text-xs text-slate-600">AI triage analysis</p>
      </div>
    );
  }

  const actions = caseData.aiSuggestions || [];
  const medicines = actions.filter((a) => a.includes("—"));
  const otherActions = actions.filter((a) => !a.includes("—"));

  return (
    <motion.div
      key={caseData.id}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI Triage Analysis</h3>
        </div>
        <SeverityBadge severity={caseData.severity} size="sm" />
      </div>

      {/* Summary */}
      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/40 border border-slate-300 dark:border-slate-700/50">
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{caseData.aiSummary}</p>
      </div>

      {/* Emergency Alert */}
      {caseData.emergencyRequired && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 animate-pulse">
          <AlertTriangle size={14} className="text-red-400" />
          <span className="text-xs font-bold text-red-400">EMERGENCY RESPONSE REQUIRED</span>
        </div>
      )}

      {/* Possible Conditions */}
      {caseData.aiSuggestions && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2 flex items-center gap-1.5">
            <Activity size={10} /> Possible Conditions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(caseData as any).possibleConditions
              ? ((caseData as any).possibleConditions as string[]).map((c, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300">
                    {c}
                  </span>
                ))
              : null}
          </div>
        </div>
      )}

      {/* Medicines — parsed with — separators */}
      {medicines.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setMedsExpanded(!medsExpanded)}
              className="flex items-center gap-1.5"
            >
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1.5">
                <Pill size={10} /> Prescribed Medicines ({medicines.length})
              </p>
              {medsExpanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
            </button>
            
            {!isEditing && caseData.status !== "closed" && (
              <button 
                onClick={() => startEditing(medicines)}
                className="text-[10px] flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Edit2 size={10} /> Edit & Approve
              </button>
            )}
          </div>

          {medsExpanded && (
            isEditing ? (
              <div className="space-y-3 mt-2">
                {editedMeds.map((med, i) => (
                  <textarea
                    key={i}
                    value={med}
                    onChange={(e) => {
                      const newMeds = [...editedMeds];
                      newMeds[i] = e.target.value;
                      setEditedMeds(newMeds);
                    }}
                    className="w-full text-xs p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500/50 resize-y"
                    rows={3}
                  />
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <Button 
                    size="sm" 
                    onClick={() => handleSaveMeds(otherActions)} 
                    disabled={saving} 
                    className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    {saving ? "Saving..." : "Approve Protocol"}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mt-2">
                {medicines.map((med, i) => {
                  const parsed = parseMedicine(med);
                  if (parsed) {
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10"
                      >
                        <p className="text-xs font-semibold text-purple-400 dark:text-purple-300 mb-1.5 flex items-center gap-1.5">
                          <Pill size={11} className="text-purple-400" />
                          {parsed.name}
                        </p>
                        <div className="space-y-0.5">
                          {parsed.details.map((d, j) => (
                            <p key={j} className="text-[11px] text-slate-700 dark:text-slate-400 pl-4">
                              <span className="text-slate-500 mr-1">›</span> {d}
                            </p>
                          ))}
                        </div>
                      </motion.div>
                    );
                  }
                  return (
                    <p key={i} className="text-xs text-slate-700 dark:text-slate-300 pl-2 border-l-2 border-purple-500/20 py-1">
                      {med}
                    </p>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* Other Actions */}
      {otherActions.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-2">
            Additional Actions
          </p>
          <ul className="space-y-1.5">
            {otherActions.map((a, i) => (
              <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5 flex-shrink-0">•</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Image if present */}
      {caseData.imageUrl && (
        <div className="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
          <img src={caseData.imageUrl} alt="Case" className="w-full max-h-48 object-cover" />
        </div>
      )}
    </motion.div>
  );
}
