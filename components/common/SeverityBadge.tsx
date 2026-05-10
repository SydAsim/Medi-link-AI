"use client";

import { cn } from "@/lib/utils";
import type { Severity } from "@/types";
import { AlertOctagon, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

interface SeverityBadgeProps {
  severity: Severity;
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const config: Record<Severity, { icon: any; label: string; classes: string }> = {
  critical: { icon: AlertOctagon, label: "CRITICAL", classes: "bg-red-600 text-slate-900 dark:text-white animate-pulse shadow-lg shadow-red-500/30" },
  high: { icon: AlertTriangle, label: "HIGH", classes: "bg-red-600 text-slate-900 dark:text-white animate-pulse" },
  medium: { icon: AlertCircle, label: "MEDIUM", classes: "bg-amber-500 text-slate-900 dark:text-white" },
  low: { icon: CheckCircle, label: "LOW", classes: "bg-emerald-500 text-slate-900 dark:text-white" },
};

export function SeverityBadge({ severity, showIcon = true, className, size = "md" }: SeverityBadgeProps) {
  const c = config[severity] || config.medium;
  const Icon = c.icon;
  const sizes = { sm: "px-2 py-0.5 text-[10px] gap-1", md: "px-2.5 py-1 text-xs gap-1.5", lg: "px-3 py-1.5 text-sm gap-2" };
  const iconSizes = { sm: 10, md: 12, lg: 14 };

  return (
    <span className={cn("inline-flex items-center rounded-full font-bold uppercase tracking-wider", c.classes, sizes[size], className)}>
      {showIcon && <Icon size={iconSizes[size]} />}
      {c.label}
    </span>
  );
}
