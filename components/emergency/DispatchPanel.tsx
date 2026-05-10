"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Truck, Navigation, CheckCircle, Clock, MapPin, Loader2, Ambulance } from "lucide-react";
import { updateCaseStatus } from "@/services/caseService";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PatientCase, CaseStatus } from "@/types";

interface DispatchPanelProps {
  caseData: PatientCase;
}

export function DispatchPanel({ caseData }: DispatchPanelProps) {
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (status: CaseStatus) => {
    setUpdating(true);
    try {
      await updateCaseStatus(caseData.id, status);
    } catch (e) {
      console.error("Failed to update status:", e);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case "pending": return 0;
      case "assigned": return 1;
      case "dispatched": return 2;
      case "arrived": return 3;
      case "completed": return 4;
      default: return 0;
    }
  };

  const step = getStatusStep(caseData.status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Ambulance size={18} className="text-red-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Ambulance Dispatch</h3>
      </div>

      {/* Progress Tracker */}
      <div className="relative flex justify-between">
        <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10" />
        <div className="absolute top-4 left-4 h-0.5 bg-red-500 transition-all duration-500 -z-10"
             style={{ width: `${(step / 3) * 100}%` }} />

        {[
          { label: "Pending", icon: Clock },
          { label: "Assigned", icon: Navigation },
          { label: "En Route", icon: Truck },
          { label: "Arrived", icon: CheckCircle },
        ].map((s, i) => {
          const active = step >= i;
          const current = step === i;
          return (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors",
                active ? "bg-white dark:bg-slate-900 border-red-500 text-red-500" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600",
                current && "ring-4 ring-red-500/20 shadow-lg shadow-red-500/20"
              )}>
                <s.icon size={14} />
              </div>
              <span className={cn("text-[9px] font-medium uppercase tracking-wider", active ? "text-slate-700 dark:text-slate-300" : "text-slate-600")}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => handleUpdate("assigned")}
          disabled={updating || step >= 1}
        >
          {updating && step < 1 ? <Loader2 size={12} className="animate-spin mr-1" /> : <Navigation size={12} className="mr-1" />}
          Assign Unit
        </Button>
        <Button
          variant={step === 1 ? "default" : "outline"}
          size="sm"
          className="text-xs"
          onClick={() => handleUpdate("dispatched")}
          disabled={updating || step >= 2 || step < 1}
        >
          {updating && step === 1 ? <Loader2 size={12} className="animate-spin mr-1" /> : <Truck size={12} className="mr-1" />}
          Dispatch
        </Button>
        <Button
          variant={step === 2 ? "default" : "outline"}
          size="sm"
          className="col-span-2 text-xs"
          onClick={() => handleUpdate("arrived")}
          disabled={updating || step >= 3 || step < 2}
        >
          {updating && step === 2 ? <Loader2 size={12} className="animate-spin mr-1" /> : <MapPin size={12} className="mr-1" />}
          Mark Arrived on Scene
        </Button>
      </div>
    </div>
  );
}
