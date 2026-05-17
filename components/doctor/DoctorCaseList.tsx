"use client";

import { useState, useEffect } from "react";
import { Loader2, Inbox } from "lucide-react";
import { subscribeToAllCases } from "@/services/caseService";
import { DoctorCaseCard } from "./DoctorCaseCard";
import type { PatientCase } from "@/types";

interface DoctorCaseListProps {
  onSelectCase: (c: PatientCase) => void;
  selectedId: string | null;
  filter: string;
}

export function DoctorCaseList({ onSelectCase, selectedId, filter }: DoctorCaseListProps) {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAllCases((all) => {
      setCases(all);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Client-side filtering
  const filtered = cases.filter((c) => {
    // IRONCLAD SECURITY FILTER: Hide explicit spam OR any case with the "Inconclusive" summary signature
    const isInconclusive = c.aiSummary?.includes("The system could not identify a clear medical emergency") || 
                         c.aiSummary?.includes("SYSTEM_NOTICE");
    
    if (c.isSpam || isInconclusive) return false;

    if (filter === "all") return c.status !== "completed" && c.status !== "closed";
    if (filter === "critical") return c.severity === "critical" || c.severity === "high";
    if (filter === "pending") return c.status === "pending";
    if (filter === "assigned") return c.status === "assigned" || c.status === "in-progress";
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 size={24} className="text-slate-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading cases...</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Inbox size={32} className="text-slate-700 mb-3" />
        <p className="text-sm text-slate-500">No cases in this view</p>
        <p className="text-xs text-slate-600 mt-1">Cases appear in real-time</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
      {filtered.map((c, i) => (
        <DoctorCaseCard
          key={c.id}
          caseData={c}
          index={i}
          selected={selectedId === c.id}
          onSelect={() => onSelectCase(c)}
        />
      ))}
    </div>
  );
}
