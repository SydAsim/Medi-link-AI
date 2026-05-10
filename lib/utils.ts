import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "high":
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "low":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    default:
      return "bg-slate-500/20 text-slate-400 border-slate-500/30";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-amber-500/20 text-amber-400";
    case "assigned":
      return "bg-blue-500/20 text-blue-400";
    case "in-progress":
      return "bg-purple-500/20 text-purple-400";
    case "dispatched":
      return "bg-cyan-500/20 text-cyan-400";
    case "resolved":
      return "bg-green-500/20 text-green-400";
    case "closed":
      return "bg-slate-500/20 text-slate-400";
    default:
      return "bg-slate-500/20 text-slate-400";
  }
}
