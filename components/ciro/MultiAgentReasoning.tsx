"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Asterisk } from "lucide-react";
import { subscribeToAllIntelligence } from "@/services/ciroService";
import type { IntelligenceLog } from "@/types";

export function MultiAgentReasoning() {
  const [logs, setLogs] = useState<IntelligenceLog[]>([]);

  useEffect(() => {
    const unsub = subscribeToAllIntelligence((data) => setLogs(data));
    return () => unsub();
  }, []);

  const getAgentLogs = (agentName: string, limit: number = 5) => {
    const filtered = logs.filter((log) => log.agentName === agentName).slice(0, limit);
    if (filtered.length === 0) return ["> Standing by for signals..."];
    return filtered.map((log) => {
      if (log.action) return `[${log.action}] ${log.thought}`;
      return `> ${log.thought}`;
    });
  };

  const getOrchestratorLogs = () => {
    const filtered = logs.filter((log) => log.agentName === "Orchestrator");
    const unique: IntelligenceLog[] = [];
    const seenThoughts = new Set<string>();

    for (const log of filtered) {
      const cleanThought = log.thought.trim().toLowerCase();
      if (!seenThoughts.has(cleanThought)) {
        seenThoughts.add(cleanThought);
        unique.push(log);
      }
    }
    return unique.slice(0, 4);
  };

  const orchestratorLogs = getOrchestratorLogs();

  const criticalCount = logs.filter(
    (l) => l.agentName === "TriageAgent" && l.action?.includes("CRITICAL")
  ).length;

  const agents = [
    {
      id: "INTEL_STREAM",
      metric: "TX: 4.2GB/S",
      color: "bg-blue-500",
      textColor: "text-blue-500",
      lightBg: "bg-blue-50 dark:bg-blue-900/10",
      borderColor: "border-blue-100 dark:border-blue-900/30",
      header: "IntelAgent Feed...",
      logs: getAgentLogs("IntelAgent"),
      command: '"Focus all surveillance on the northwest corridor."',
    },
    {
      id: "LOG_SUPPLY",
      metric: "RESOURCES: 88%",
      color: "bg-emerald-500",
      textColor: "text-emerald-500",
      lightBg: "bg-emerald-50 dark:bg-emerald-900/10",
      borderColor: "border-emerald-100 dark:border-emerald-900/30",
      header: "LogisticsAgent Routing...",
      logs: getAgentLogs("LogisticsAgent"),
      command: '"Accelerate the deployment of Unit Alpha-4."',
    },
    {
      id: "STRAT_ANALYSIS",
      metric: "CONFIDENCE: 94%",
      color: "bg-amber-500",
      textColor: "text-amber-500",
      lightBg: "bg-amber-50 dark:bg-amber-900/10",
      borderColor: "border-amber-100 dark:border-amber-900/30",
      header: "StrategistAgent Planning...",
      logs: getAgentLogs("StrategistAgent"),
      command: '"Prepare backup contingencies for Node-7 breach."',
    },
    {
      id: "TRIAGE_PULSE",
      metric: `CRITICAL: ${criticalCount}`,
      color: "bg-red-500",
      textColor: "text-red-500",
      lightBg: "bg-red-50 dark:bg-red-900/10",
      borderColor: "border-red-100 dark:border-red-900/30",
      header: "TriageAgent Vitals...",
      logs: getAgentLogs("TriageAgent"),
      command: '"Escalate all critical cases to on-duty physicians immediately."',
    },
  ];

  return (
    <div className="flex flex-col items-center mt-12 w-full">
      {/* The Orchestrator (Top Node) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-xl mb-0"
      >
        <div className={cn(
          "flex flex-col rounded-xl border shadow-sm overflow-hidden p-0",
          "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
        )}>
          {/* Header */}
          <div className="flex flex-col items-center justify-center p-6 border-b border-slate-100 dark:border-slate-800">
            <Asterisk size={28} className="animate-spin-slow mb-2 text-purple-500" />
            <h2 className="text-xl font-black uppercase tracking-widest mb-1 text-slate-900 dark:text-white">The Orchestrator</h2>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-purple-500">Master Control Node</p>
          </div>

          {/* Orchestrator Internal Reasoning Feed */}
          <div className="w-full bg-slate-50 dark:bg-slate-950 font-mono text-[11px] p-4 text-left space-y-3 h-[260px] overflow-y-auto custom-scrollbar text-slate-600 dark:text-slate-400">
            <div className="text-purple-500 font-bold mb-1 border-b border-slate-200 dark:border-slate-800/80 pb-2 flex items-center justify-between">
              <span>Synthesizing multi-agent data streams...</span>
              <span className="text-[9px] bg-purple-500/10 px-2 py-0.5 rounded text-purple-400 animate-pulse">ACTIVE_SYNAPSE</span>
            </div>
            {orchestratorLogs.length === 0 ? (
              <div className="opacity-50 mt-2">&gt; Standing by...</div>
            ) : (
              <div className="space-y-2">
                {orchestratorLogs.map((log, i) => {
                  const isCrisis = log.action?.includes("CRISIS") || log.action?.includes("UPGRADE");
                  const isAction = !!log.action;
                  return (
                    <div key={log.id || i} className="flex items-start gap-2.5 p-2 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 shadow-2xs">
                      {isAction ? (
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0",
                          isCrisis 
                            ? "bg-red-500/15 text-red-500 border border-red-500/20" 
                            : log.action === "TASK_EXECUTED"
                            ? "bg-purple-500/15 text-purple-500 border border-purple-500/20"
                            : "bg-blue-500/15 text-blue-500 border border-blue-500/20"
                        )}>
                          {log.action}
                        </span>
                      ) : (
                        <span className="text-slate-400 shrink-0">&gt;</span>
                      )}
                      <span className={cn(
                        "leading-relaxed font-mono text-[10px] text-slate-700 dark:text-slate-300",
                        isCrisis && "font-semibold text-red-600 dark:text-red-400"
                      )}>
                        {log.thought}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Flowchart Lines (Desktop) */}
      <div className="hidden xl:grid grid-cols-4 gap-4 w-full h-16 relative">
        <div className="absolute top-1/2 left-[12.5%] right-[12.5%] h-[2px] bg-slate-300 dark:bg-slate-700" />
        <div className="absolute top-0 left-1/2 w-[2px] h-1/2 bg-slate-300 dark:bg-slate-700 -translate-x-1/2" />
        {agents.map((_, i) => (
          <div key={i} className="flex justify-center items-end h-full relative z-10">
            <div className="w-[2px] h-1/2 bg-slate-300 dark:bg-slate-700" />
            <div className="absolute bottom-0 translate-y-[2px] w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-300 dark:border-t-slate-700" />
          </div>
        ))}
      </div>

      {/* Flowchart Lines (Mobile) */}
      <div className="xl:hidden w-full h-8 relative flex justify-center">
        <div className="w-[2px] h-full bg-slate-300 dark:bg-slate-700" />
        <div className="absolute bottom-0 translate-y-[2px] w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-slate-300 dark:border-t-slate-700" />
      </div>

      {/* The 4 Sub-agents */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full relative z-10">
        {agents.map((agent, idx) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 + 0.2 }}
            className="flex flex-col rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={cn("w-1 h-3 rounded-full", agent.color)} />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  {agent.id}
                </span>
              </div>
              <span className={cn("text-[9px] font-bold tracking-wider", agent.id === "TRIAGE_PULSE" ? "text-red-400" : "text-slate-400")}>
                {agent.metric}
              </span>
            </div>

            {/* Logs Body */}
            <div className="p-4 flex-1 font-mono text-[11px] leading-relaxed space-y-3 text-slate-600 dark:text-slate-400 h-[250px] overflow-y-auto custom-scrollbar">
              <div className={cn("font-medium", agent.textColor)}>
                {agent.header}
              </div>
              <div className="space-y-2">
                {agent.logs.map((log, i) => {
                  const isAlert = log.includes("[ALERT]") || log.includes("[URGENT]") || log.includes("[SEVERITY_CRITICAL]");
                  const isAction = log.startsWith("[");
                  return (
                    <div
                      key={i}
                      className={cn(
                        "leading-relaxed",
                        isAlert && "text-red-500 font-bold",
                        isAction && !isAlert && "font-semibold text-slate-800 dark:text-slate-200"
                      )}
                    >
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Orchestrator Command */}
            <div className={cn("p-4 border-t", agent.lightBg, agent.borderColor)}>
              <div className={cn("flex items-center gap-1.5 mb-2", agent.textColor)}>
                <Asterisk size={14} className="animate-spin-slow" />
                <span className="text-[9px] font-bold uppercase tracking-widest">Orchestrator Command</span>
              </div>
              <div className="text-xs font-medium italic text-slate-700 dark:text-slate-300">
                {agent.command}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
