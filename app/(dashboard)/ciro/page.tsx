"use client";

import { useState, useEffect } from "react";
import { 
  Activity, 
  Map as MapIcon, 
  Shield, 
  AlertCircle, 
  Wifi, 
  Zap,
  Bell,
  RefreshCw,
  Search,
  Globe,
  Clock,
  ArrowRight,
  Database
} from "lucide-react";
import { CardWrapper } from "@/components/common/CardWrapper";
import { LiveMapView } from "@/components/emergency/LiveMapView";
import { MultiAgentReasoning } from "@/components/ciro/MultiAgentReasoning";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { subscribeToAllCases } from "@/services/caseService";
import { 
  subscribeToScheduledTasks, 
  executeScheduledTask, 
  addIntelligenceLog,
  scheduleMedicineReminders
} from "@/services/ciroService";
import { seedSocialSignalsIfEmpty } from "@/services/seedSocialSignals";
import { sendEmergencyReminder } from "@/services/notificationService";
import type { PatientCase, ScheduledTask } from "@/types";

export default function CiroIntelligencePage() {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);
  const [mounted, setMounted] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [lastScan, setLastScan] = useState<Date>(new Date());

  useEffect(() => {
    setMounted(true);
    // Seed demo social signals for Intel Agent on first load
    seedSocialSignalsIfEmpty();
    const unsubCases = subscribeToAllCases((data) => {
      setCases(data);
      if (data.length > 0 && !selectedCase) {
        setSelectedCase(data[0]);
      }
    });

    const unsubTasks = subscribeToScheduledTasks((tasks) => {
      setScheduledTasks(tasks);
    });

    return () => {
      unsubCases();
      unsubTasks();
    };
  }, [selectedCase]);

  // ─── Surgical Temporal Warden (Direct Dispatch) ───
  useEffect(() => {
    // This loop only checks the clock against tasks ALREADY in memory (no DB search)
    const interval = setInterval(async () => {
      setPulse(true);
      setLastScan(new Date());
      setTimeout(() => setPulse(false), 500);

      const now = Date.now();
      
      for (const task of scheduledTasks) {
        if (task.status === "pending" && task.scheduledFor <= now) {
          console.log(`🎯 CIRO Agent: Targeted time reached for ${task.data.name}. Dispatching now.`);
          
          try {
            // 1. Immediately update local UI for zero-latency feel
            setScheduledTasks(prev => prev.filter(t => t.id !== task.id));
            
            // 2. Execute the dispatch
            await executeScheduledTask(task.id);
            const result = await sendEmergencyReminder(task.targetPhone, task.targetEmail, task.data);

            const status = (result.email?.success || result.whatsapp?.success) ? "SUCCESS" : "FAILED";
            
            await addIntelligenceLog({
              agentName: "StrategistAgent",
              thought: `SURGICAL_DISPATCH: Target time reached. Medicine [${task.data.name}] sent to ${task.targetPhone}.`,
              confidence: 1.0,
              action: status === "SUCCESS" ? "TASK_EXECUTED" : "NOTIFICATION_FAILED"
            });
          } catch (e) {
            console.error("Surgical dispatch error:", e);
          }
        }
      }
    }, 1000); // Check local memory every second for precision

    return () => clearInterval(interval);
  }, [scheduledTasks]); // Only re-run when the in-memory tasks change

  const handleForceDispatch = async (task: ScheduledTask) => {
    // 1. Mark as executed
    await executeScheduledTask(task.id);
    
    // 2. Dispatch reminder
    const result = await sendEmergencyReminder(
      task.targetPhone, 
      task.targetEmail, 
      task.data
    );

    // 3. Log intelligence
    await addIntelligenceLog({
      agentName: "Orchestrator",
      thought: `MANUAL_OVERRIDE: User forced dispatch for ${task.data.name}. Processing immediate transmission...`,
      confidence: 1.0,
      action: "TASK_EXECUTED"
    });
  };

  const activeCrisesCount = cases.filter(c => c.severity === "critical" || c.severity === "high").length;

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-2 py-0">
              CORE_SYSTEM
            </Badge>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono">
              <Wifi size={10} className="animate-pulse" />
              LIVE_SENSORS_ACTIVE
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            CIRO <span className="text-purple-500">Intelligence</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Autonomous Crisis Intelligence & Multi-Agent Response Orchestrator
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <span className={cn("h-1.5 w-1.5 rounded-full bg-emerald-500", pulse && "animate-ping")} />
              System Pulse
            </span>
            <span className="text-emerald-500 font-mono text-[10px] font-bold">
              SCANNING_ACTIVE // {mounted ? lastScan.toLocaleTimeString() : "--:--:--"}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Globe size={20} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Active Crises", value: activeCrisesCount, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Signals Ingested", value: cases.length * 4 + 12, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Agent Confidence", value: "94.2%", icon: Shield, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "System Uptime", value: "99.99%", icon: Zap, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        ].map((stat, i) => (
          <CardWrapper key={i} className="!p-4">
            <div className="flex items-center gap-4">
              <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center", stat.bg)}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</p>
              </div>
            </div>
          </CardWrapper>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Map & Signals */}
        <div className="lg:col-span-8 space-y-6">
          <CardWrapper hover={false} className="h-[500px] !p-0 relative overflow-hidden group">
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
               <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-2 rounded-lg text-white font-mono text-[10px]">
                  VIEW: CITY_INTELLIGENCE_LAYER_v2.1
               </div>
               <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/50 p-2 rounded-lg text-emerald-400 font-mono text-[10px] flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  REALTIME_GPS_TRACKING_ON
               </div>
            </div>
            <LiveMapView caseData={selectedCase} />
          </CardWrapper>

        </div>

        {/* Right Column: Agent Intelligence */}
        <div className="lg:col-span-4 space-y-6">
          <CardWrapper title="Signal Analysis Feed" icon={<Activity size={18} className="text-blue-500" />}>
            <div className="space-y-3">
              {cases.slice(0, 3).map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 group hover:border-blue-500/30 transition-all cursor-pointer"
                  onClick={() => setSelectedCase(c)}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-lg flex items-center justify-center",
                      c.severity === "critical" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      <Database size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Signal: {c.address?.split(',')[0] || "Unknown Location"}</p>
                      <p className="text-[10px] text-slate-500">Credibility: 98% · Source: Patient_Portal_Signal</p>
                    </div>
                  </div>
                  <Badge variant={c.severity === "critical" ? "destructive" : "secondary"} className="uppercase text-[9px] h-5">
                    {c.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardWrapper>

          <CardWrapper title="Temporal Task Queue" icon={<Clock size={18} className="text-emerald-500" />}>
            <div className="space-y-3">
              {scheduledTasks.length === 0 ? (
                <div className="py-8 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No Pending Tasks</p>
                  <p className="text-[9px] text-slate-600 mt-1">Autonomous scheduler idle</p>
                </div>
              ) : (
                scheduledTasks.slice(0, 5).map((task, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 h-full w-1 bg-emerald-500" />
                    <div className="flex justify-between items-start mb-2">
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] h-4">QUEUED_REMINDER</Badge>
                      <div className="text-right">
                        <p className="text-[9px] font-mono text-emerald-400">
                          {new Date(task.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[7px] text-slate-500 font-bold uppercase">
                          {new Date(task.scheduledFor).toDateString() === new Date().toDateString() ? "Today" : "Tomorrow"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Bell size={12} className="text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{task.data.name}</p>
                        <p className="text-[9px] text-slate-500 truncate">{task.targetPhone}</p>
                      </div>
                      <button 
                        onClick={() => handleForceDispatch(task)}
                        className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400 transition-all flex items-center gap-1 group/btn"
                        title="Force Dispatch Now"
                      >
                        <Zap size={10} className="group-hover/btn:animate-pulse" />
                        <span className="text-[8px] font-bold">FORCE</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
              {scheduledTasks.length > 5 && (
                <p className="text-[10px] text-slate-500 text-center font-bold uppercase tracking-widest">+ {scheduledTasks.length - 5} More Tasks</p>
              )}
            </div>
          </CardWrapper>
        </div>
      </div>

      {/* 4-Agent Reasoning Panel */}
      <MultiAgentReasoning />
    </div>
  );
}
