"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Wifi, WifiOff, LocateFixed, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveLocationStatusProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function LiveLocationStatus({
  latitude,
  longitude,
  accuracy,
  address,
  loading,
  error,
  onRefresh,
}: LiveLocationStatusProps) {
  const isConnected = latitude !== null && longitude !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300",
        isConnected
          ? "bg-emerald-500/5 border-emerald-500/20"
          : error
          ? "bg-red-500/5 border-red-500/20"
          : "bg-slate-100 dark:bg-slate-800/30 border-slate-300 dark:border-slate-700/50"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <div
          className={cn(
            "p-2 rounded-lg",
            isConnected
              ? "bg-emerald-500/10"
              : error
              ? "bg-red-500/10"
              : "bg-slate-200 dark:bg-slate-700/50"
          )}
        >
          {loading ? (
            <Loader2 size={18} className="text-slate-600 dark:text-slate-400 animate-spin" />
          ) : isConnected ? (
            <MapPin size={18} className="text-emerald-400" />
          ) : (
            <WifiOff size={18} className="text-red-400" />
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                isConnected ? "text-emerald-400" : error ? "text-red-400" : "text-slate-600 dark:text-slate-400"
              )}
            >
              {loading
                ? "Acquiring GPS..."
                : isConnected
                ? "GPS Connected"
                : error
                ? "GPS Error"
                : "GPS Offline"}
            </span>
            {isConnected && (
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          {isConnected && (
            <div className="space-y-0.5">
              <p className={cn(
                "text-[11px] font-medium leading-tight",
                address?.includes("Network") ? "text-amber-500/80" : "text-emerald-500/80"
              )}>
                {address || `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
              </p>
              <p className="text-[10px] text-slate-500 opacity-70">
                {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                {accuracy && ` · ±${Math.round(accuracy)}m`}
              </p>
            </div>
          )}
          {error && (
            <p className="text-[11px] text-red-400/70 mt-0.5">{error}</p>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        className="p-2 rounded-lg hover:bg-slate-200 dark:bg-slate-700/50 text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors"
        title="Refresh location"
      >
        <LocateFixed size={16} />
      </button>
    </motion.div>
  );
}
