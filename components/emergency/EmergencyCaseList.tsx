"use client";

import { useState, useEffect } from "react";
import { Loader2, Inbox, Siren } from "lucide-react";
import { subscribeToAllCases } from "@/services/caseService";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { cn, getRelativeTime } from "@/lib/utils";
import { motion } from "framer-motion";
import { Phone, Clock, MapPin } from "lucide-react";
import type { PatientCase } from "@/types";

interface EmergencyCaseListProps {
  onSelectCase: (c: PatientCase) => void;
  selectedId: string | null;
}

export function EmergencyCaseList({ onSelectCase, selectedId }: EmergencyCaseListProps) {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAllCases((all) => {
      // Client-side filter: HIGH + CRITICAL severity, not completed
      const emergency = all
        .filter((c) => (c.severity === "high" || c.severity === "critical") && c.status !== "completed" && c.status !== "closed")
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setCases(emergency);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={20} className="text-slate-500 animate-spin mb-2" />
        <p className="text-xs text-slate-500">Loading cases...</p>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Inbox size={28} className="text-slate-700 mb-2" />
        <p className="text-xs text-slate-500">No emergency cases</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
      {cases.map((c, i) => {
        const isSelected = selectedId === c.id;
        return (
          <motion.button
            key={c.id}
            type="button"
            onClick={() => onSelectCase(c)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "w-full text-left p-3 rounded-lg border transition-all duration-150",
              isSelected
                ? "bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20"
                : "bg-slate-100 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800/40"
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <SeverityBadge severity={c.severity} size="sm" />
              <span className="text-[9px] text-slate-500">
                {typeof c.createdAt === "number" ? getRelativeTime(c.createdAt) : "Now"}
              </span>
            </div>
            <p className="text-xs text-slate-800 dark:text-slate-200 line-clamp-1 mb-1">{c.issueText}</p>
            <div className="flex items-center gap-2 text-[9px] text-slate-500">
              <span className="flex items-center gap-0.5"><Phone size={8} />{c.patientPhone}</span>
              <span className="flex items-center gap-0.5"><MapPin size={8} />{c.latitude?.toFixed(2)},{c.longitude?.toFixed(2)}</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
