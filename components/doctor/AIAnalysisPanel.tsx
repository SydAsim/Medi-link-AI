"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, Pill, AlertTriangle, Activity, ChevronDown, ChevronUp, Sparkles, Edit2, CheckCircle, Loader2, MapPin, Trash2, Plus } from "lucide-react";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateCase } from "@/services/caseService";
import { addPrescriptionToHistory } from "@/services/profileService";
import { scheduleMedicineReminders } from "@/services/ciroService";
import type { PatientCase, Medication } from "@/types";

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
  const [saving, setSaving] = useState(false);
  const [protocolApproved, setProtocolApproved] = useState(caseData?.protocolApproved || false);

  // Structured medicine state
  const [structuredMeds, setStructuredMeds] = useState<{
    name: string;
    dosage: string;
    frequency: string;
    purpose: string;
    original: string;
  }[]>([]);

  // Sync edited meds when entering edit mode
  const startEditing = (medicines: string[]) => {
    const parsed = medicines.map(m => {
      const parts = m.split(" — ").map(p => p.trim());
      return {
        name: parts[0] || m,
        dosage: parts[1] || "",
        frequency: "", // AI no longer suggests this, doctor must decide
        purpose: parts[parts.length - 1] || "",
        original: m
      };
    });
    setStructuredMeds(parsed);
    setIsEditing(true);
  };

  const handleApproveProtocol = async (otherActions: string[]) => {
    if (!caseData || structuredMeds.length === 0) return;
    setSaving(true);
    try {
      // Re-construct the AI suggestions with the doctor's frequency
      const finalizedMeds = structuredMeds
        .filter(m => m.name.trim() !== "")
        .map(m => 
          `${m.name} — ${m.dosage || 'As prescribed'} — ${m.frequency || 'As directed'} — ${m.purpose || 'Therapeutic'}`
        );
      
      const updatedSuggestions = [...otherActions, ...finalizedMeds];
      
      await updateCase(caseData.id, { 
        aiSuggestions: updatedSuggestions,
        protocolApproved: true 
      });
      
      // Save to Patient Profile History
      for (const m of structuredMeds.filter(m => m.name.trim() !== "")) {
        await addPrescriptionToHistory(caseData.patientPhone, {
          name: m.name,
          dosage: m.dosage || "As prescribed",
          frequency: m.frequency || "As directed",
          remainingDoses: 30,
          totalDoses: 30,
          prescribedBy: "Dr. Physician (MediLink)",
        });

        // Trigger the AI Continuity Agent to schedule reminders
        if (m.frequency) {
          await scheduleMedicineReminders(caseData.patientPhone, {
            name: m.name,
            dosage: m.dosage || "As prescribed",
            frequency: m.frequency,
            purpose: m.purpose
          });
        }
      }

      setProtocolApproved(true);
      setIsEditing(false);
    } catch (e) {
      console.error("Failed to approve protocol", e);
    } finally {
      setSaving(false);
    }
  };

  const addNewMed = () => {
    setStructuredMeds([
      ...structuredMeds,
      { name: "", dosage: "", frequency: "", purpose: "", original: "" }
    ]);
  };

  const removeMed = (index: number) => {
    const newMeds = [...structuredMeds];
    newMeds.splice(index, 1);
    setStructuredMeds(newMeds);
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
  // Strictly filter out any empty or malformed suggestions
  const medicines = actions.filter((a) => a && a.includes("—") && a.trim() !== "");
  const otherActions = actions.filter((a) => a && !a.includes("—") && a.trim() !== "");

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
      
      {/* Location Details */}
      {(caseData.address || caseData.nearbyLandmarks) && (
        <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-blue-400" />
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Patient Location Context</p>
          </div>
          {caseData.address && (
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-tight">
              {caseData.address}
            </p>
          )}
          {caseData.nearbyLandmarks && caseData.nearbyLandmarks.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {caseData.nearbyLandmarks.map((l, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-blue-500/10 text-[9px] text-blue-400 border border-blue-500/20">
                  📍 {l}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

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
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => startEditing(medicines)}
                  className="text-[10px] px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-1"
                >
                  <Edit2 size={10} /> {caseData.protocolApproved ? "Adjust Protocol" : "Edit Medicine"}
                </button>
                {!caseData.protocolApproved && structuredMeds.length > 0 && (
                  <button 
                    onClick={() => handleApproveProtocol(otherActions)}
                    className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                  >
                    <CheckCircle size={10} /> Approve Protocol
                  </button>
                )}
              </div>
            )}
            {caseData.protocolApproved && !isEditing && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold ml-2">
                <CheckCircle size={10} /> Protocol Active
              </div>
            )}
          </div>

          {medsExpanded && (
            isEditing ? (
              <div className="space-y-4 mt-2">
                {structuredMeds.map((med, i) => (
                  <div key={i} className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 space-y-3 relative group">
                    <button 
                      onClick={() => removeMed(i)}
                      className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-500 transition-colors"
                      title="Remove medicine"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Medicine Name</label>
                        <input
                          value={med.name}
                          onChange={(e) => {
                            const newMeds = [...structuredMeds];
                            newMeds[i].name = e.target.value;
                            setStructuredMeds(newMeds);
                          }}
                          placeholder="e.g. Panadol"
                          className="w-full text-xs p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Dosage</label>
                        <input
                          value={med.dosage}
                          onChange={(e) => {
                            const newMeds = [...structuredMeds];
                            newMeds[i].dosage = e.target.value;
                            setStructuredMeds(newMeds);
                          }}
                          placeholder="e.g. 500mg"
                          className="w-full text-xs p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Prescription Schedule (Time/Frequency)</label>
                      <input
                        value={med.frequency}
                        onChange={(e) => {
                          const newMeds = [...structuredMeds];
                          newMeds[i].frequency = e.target.value;
                          setStructuredMeds(newMeds);
                        }}
                        placeholder="e.g. Every 8 hours after meals"
                        className="w-full text-xs p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-purple-500/50 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Purpose/Notes</label>
                      <input
                        value={med.purpose}
                        onChange={(e) => {
                          const newMeds = [...structuredMeds];
                          newMeds[i].purpose = e.target.value;
                          setStructuredMeds(newMeds);
                        }}
                        placeholder="e.g. Pain management"
                        className="w-full text-[11px] p-2 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={addNewMed}
                  className="w-full py-2 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-[10px] text-slate-500 hover:text-purple-400 hover:border-purple-400/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} /> Add Additional Medicine
                </button>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <Button 
                    size="sm" 
                    onClick={() => handleApproveProtocol(otherActions)} 
                    disabled={saving || structuredMeds.some(m => !m.name || !m.frequency)} 
                    className="h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 px-4"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    {saving ? "Updating..." : (caseData.protocolApproved ? "Update & Re-approve" : "Finalize & Approve Protocol")}
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
                {structuredMeds.some(m => !m.frequency && m.name) && (
                  <p className="text-[9px] text-amber-500 flex items-center gap-1">
                    <AlertTriangle size={10} /> Schedule is required for all active medications.
                  </p>
                )}
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
