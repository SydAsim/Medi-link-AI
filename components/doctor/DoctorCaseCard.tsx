"use client";

import { motion } from "framer-motion";
import { Phone, MapPin, Clock, MessageCircle, Image as ImageIcon } from "lucide-react";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { cn, getRelativeTime, getStatusColor } from "@/lib/utils";
import type { PatientCase } from "@/types";

interface DoctorCaseCardProps {
  caseData: PatientCase;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

export function DoctorCaseCard({ caseData, index, selected, onSelect }: DoctorCaseCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ x: 4 }}
      className={cn(
        "w-full text-left p-4 rounded-xl border transition-all duration-200",
        selected
          ? "bg-red-500/5 border-red-500/30 ring-1 ring-red-500/20"
          : "bg-slate-100 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800/40 hover:border-slate-300 dark:border-slate-700"
      )}
    >
      {/* Top Row */}
      <div className="flex items-center justify-between mb-2">
        <SeverityBadge severity={caseData.severity} size="sm" />
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", getStatusColor(caseData.status))}>
          {caseData.status}
        </span>
      </div>

      {/* Issue Text */}
      <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2 mb-2 leading-relaxed">
        {caseData.issueText}
      </p>

      {/* Meta Row */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Phone size={9} />
          {caseData.patientPhone}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={9} />
          {getRelativeTime(caseData.createdAt)}
        </span>
        {caseData.imageUrl && (
          <span className="flex items-center gap-1 text-purple-400">
            <ImageIcon size={9} />
            IMG
          </span>
        )}
        <span className="flex items-center gap-1">
          <MapPin size={9} />
          {caseData.latitude?.toFixed(2)},{caseData.longitude?.toFixed(2)}
        </span>
      </div>

      {/* AI Summary Preview */}
      {caseData.aiSummary && (
        <p className="mt-2 text-[11px] text-slate-500 line-clamp-1 italic">
          AI: {caseData.aiSummary}
        </p>
      )}
    </motion.button>
  );
}
