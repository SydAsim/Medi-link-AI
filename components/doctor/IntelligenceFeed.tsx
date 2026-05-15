"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, 
  Brain, 
  Activity, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { subscribeToAllIntelligence } from "@/services/ciroService";
import type { IntelligenceLog } from "@/types";

export function IntelligenceFeed() {
  const [logs, setLogs] = useState<IntelligenceLog[]>([]);
  const [expanded, setExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToAllIntelligence((data) => {
      setLogs(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs]);

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case "Orchestrator": return <ShieldCheck size={12} className="text-emerald-400" />;
      case "IntelAgent": return <Activity size={12} className="text-blue-400" />;
      case "TriageAgent": return <Brain size={12} className="text-purple-400" />;
      case "LogisticsAgent": return <Clock size={12} className="text-amber-400" />;
      case "StrategistAgent": return <Sparkles size={12} className="text-cyan-400" />;
      default: return <Terminal size={12} className="text-slate-400" />;
    }
  };

  return (
    <div className={cn(
      "rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900/90 backdrop-blur-md overflow-hidden transition-all duration-300",
      expanded ? "h-[400px]" : "h-12"
    )}>
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-slate-800 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Terminal size={16} className="text-emerald-500" />
            <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="text-xs font-bold tracking-widest text-slate-100 uppercase">CIRO Intelligence Feed</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-emerald-500/70 hidden sm:inline">AGENTIC_REASONING_ACTIVE</span>
          {expanded ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronUp size={14} className="text-slate-500" />}
        </div>
      </div>

      {/* Logs Area */}
      <div 
        ref={scrollRef}
        className="p-4 overflow-y-auto h-[352px] font-mono text-[11px] space-y-3 custom-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 opacity-50">
              <Activity className="animate-pulse mb-2" size={20} />
              <p>Standing by for signals...</p>
            </div>
          ) : (
            logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "p-2.5 rounded-lg border leading-relaxed",
                  log.action?.includes("ALERT") || log.action?.includes("UPGRADE")
                    ? "bg-red-500/10 border-red-500/20 text-red-100"
                    : "bg-slate-800/40 border-slate-700/50 text-slate-300"
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {getAgentIcon(log.agentName)}
                    <span className={cn(
                      "font-bold uppercase text-[9px]",
                      log.agentName === "Orchestrator" ? "text-emerald-400" : "text-slate-400"
                    )}>
                      {log.agentName}
                    </span>
                  </div>
                  <span className="text-[9px] opacity-40">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                
                <p className="pl-4 border-l border-slate-700/50">
                  {log.thought}
                </p>

                {log.action && (
                  <div className="mt-2 flex items-center gap-1.5 pl-4">
                    <div className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                      ACTION: {log.action}
                    </div>
                    {log.confidence && (
                      <div className="text-[9px] text-slate-500">
                        Conf: {(log.confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
