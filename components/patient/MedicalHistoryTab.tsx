"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Plus, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Pill, 
  History,
  Trash2,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  getPatientProfile, 
  updatePatientProfile, 
  uploadMedicalRecord 
} from "@/services/profileService";
import type { PatientProfile, Medication } from "@/types";
import { Badge } from "@/components/ui/badge";

export function MedicalHistoryTab({ phone }: { phone: string }) {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");

  useEffect(() => {
    if (!phone) return;
    loadProfile();
  }, [phone]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const p = await getPatientProfile(phone);
      setProfile(p);
    } catch (e) {
      console.error("Failed to load profile:", e);
    } finally {
      setLoading(false);
    }
  };

  const addAllergy = async () => {
    if (!newAllergy.trim() || !profile) return;
    setUpdating(true);
    try {
      const updatedAllergies = [...profile.allergies, newAllergy.trim()];
      await updatePatientProfile(phone, { allergies: updatedAllergies });
      setProfile({ ...profile, allergies: updatedAllergies });
      setNewAllergy("");
    } finally { setUpdating(false); }
  };

  const addCondition = async () => {
    if (!newCondition.trim() || !profile) return;
    setUpdating(true);
    try {
      const updatedConditions = [...profile.chronicConditions, newCondition.trim()];
      await updatePatientProfile(phone, { chronicConditions: updatedConditions });
      setProfile({ ...profile, chronicConditions: updatedConditions });
      setNewCondition("");
    } finally { setUpdating(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !phone) return;
    setUpdating(true);
    try {
      await uploadMedicalRecord(phone, file);
      await loadProfile();
    } finally { setUpdating(false); }
  };

  if (loading) return (
    <div className="h-60 flex items-center justify-center">
      <div className="h-8 w-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 1. Safety Alerts (Allergies & Conditions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allergies */}
        <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert size={18} className="text-red-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Known Allergies</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {profile?.allergies.length ? profile.allergies.map((a, i) => (
              <Badge key={i} variant="outline" className="bg-white dark:bg-slate-900 text-red-500 border-red-500/30">
                {a}
              </Badge>
            )) : <p className="text-xs text-slate-500 italic">No allergies listed</p>}
          </div>
          <div className="flex gap-2">
            <input 
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              placeholder="Add allergy (e.g. Penicillin)"
              className="flex-1 text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
            />
            <button onClick={addAllergy} disabled={updating} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50">
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Chronic Conditions */}
        <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={18} className="text-blue-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Chronic Conditions</h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {profile?.chronicConditions.length ? profile.chronicConditions.map((c, i) => (
              <Badge key={i} variant="outline" className="bg-white dark:bg-slate-900 text-blue-500 border-blue-500/30">
                {c}
              </Badge>
            )) : <p className="text-xs text-slate-500 italic">No conditions listed</p>}
          </div>
          <div className="flex gap-2">
            <input 
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              placeholder="Add condition (e.g. Asthma)"
              className="flex-1 text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none"
            />
            <button onClick={addCondition} disabled={updating} className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Uploaded Records */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History size={18} className="text-slate-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Medical Records</h3>
          </div>
          <label className="cursor-pointer px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-2 transition-all">
            <Upload size={14} />
            Upload PDF/Image
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,image/*" />
          </label>
        </div>
        
        {profile?.pastMedicalRecords.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {profile.pastMedicalRecords.map((url, i) => (
              <a 
                key={i} 
                href={url} 
                target="_blank" 
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group"
              >
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-500/20 group-hover:text-blue-500">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">Medical Record #{i+1}</p>
                  <p className="text-[10px] text-slate-500">Click to view document</p>
                </div>
                <ChevronRight size={14} className="text-slate-400" />
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl">
            <FileText size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500">No records uploaded yet.</p>
          </div>
        )}
      </div>

      {/* 3. Current Medications & History */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center gap-2 mb-4">
          <Pill size={18} className="text-emerald-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Active Medications</h3>
        </div>
        
        {profile?.currentMedications.length ? (
          <div className="space-y-3">
            {profile.currentMedications.map((med) => (
              <div key={med.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{med.name}</h4>
                    <p className="text-[10px] text-slate-500">{med.dosage} • {med.frequency}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    Prescribed by {med.prescribedBy}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-slate-500">Remaining Doses</span>
                      <span className="text-[10px] font-bold">{med.remainingDoses} / {med.totalDoses}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          med.remainingDoses < 5 ? "bg-red-500" : "bg-emerald-500"
                        )}
                        style={{ width: `${(med.remainingDoses / med.totalDoses) * 100}%` }}
                      />
                    </div>
                  </div>
                  {med.remainingDoses < 5 && (
                    <div className="flex items-center gap-1 text-red-500 animate-pulse">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-bold">Refill Soon</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Pill size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs text-slate-500">No active prescriptions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
