"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Siren, MapPin, Truck, AlertOctagon, Radio, Navigation,
  ShieldAlert, Users, Brain, Pill, Activity, MessageCircle,
  Phone, Hospital, Clock, CheckCircle2, ChevronDown, ChevronUp
} from "lucide-react";
import { CardWrapper } from "@/components/common/CardWrapper";
import { Button } from "@/components/ui/button";
import { EmergencyCaseList } from "@/components/emergency/EmergencyCaseList";
import { DispatchPanel } from "@/components/emergency/DispatchPanel";
import { LiveMapView } from "@/components/emergency/LiveMapView";
import { RealtimeChat } from "@/components/common/RealtimeChat";
import { subscribeToAllCases } from "@/services/caseService";
import { subscribeToChatMessages, sendMessage } from "@/services/chatService";
import { subscribeToIntelligenceLogs } from "@/services/ciroService";
import { runLogisticsAgent, type LogisticsResult } from "@/services/logisticsAgent";
import { cn } from "@/lib/utils";
import type { PatientCase, ChatMessage, IntelligenceLog } from "@/types";

export default function EmergencyPage() {
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [allCases, setAllCases] = useState<PatientCase[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [logisticsResult, setLogisticsResult] = useState<LogisticsResult | null>(null);
  const [logisticsLoading, setLogisticsLoading] = useState(false);
  const [logisticsExpanded, setLogisticsExpanded] = useState(false);

  const [intelLogs, setIntelLogs] = useState<IntelligenceLog[]>([]);
  const [activeTab, setActiveTab] = useState<"intel" | "med" | "chat">("intel");

  useEffect(() => {
    const unsub = subscribeToAllCases((cases) => setAllCases(cases));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedCase) { setMessages([]); return; }
    const unsub = subscribeToChatMessages(selectedCase.id, (msgs) => setMessages(msgs));
    return () => unsub();
  }, [selectedCase?.id]);

  useEffect(() => {
    if (!selectedCase) { setIntelLogs([]); return; }
    const unsub = subscribeToIntelligenceLogs(selectedCase.id, "case", (logs) => {
      setIntelLogs(logs.filter(l => l.agentName === "IntelAgent"));
    });
    return () => unsub();
  }, [selectedCase?.id]);

  useEffect(() => {
    if (!selectedCase) return;
    const isHighSeverity = selectedCase.severity === "critical" || selectedCase.severity === "high";
    if (!isHighSeverity) { setLogisticsResult(null); return; }

    if ((selectedCase as any).logisticsDispatched) {
      if (!logisticsResult) {
        const { latitude: lat, longitude: lng } = selectedCase;
        setLogisticsResult({
          hospitals: [],
          ambulanceServices: [{
            name: "Edhi Foundation Ambulance", address: "Near Peshawar Cantt",
            phone: "+92-21-115-3911", distance: "0.8 km", duration: "3 mins",
            type: "ambulance_service", lat: lat + 0.007, lng: lng - 0.004,
          }],
          bestHospital: {
            name: "Hayatabad Medical Complex", address: "Phase 5, Hayatabad, Peshawar",
            phone: "+92-91-9217480", distance: "1.4 km", duration: "5 mins",
            type: "hospital", lat: lat + 0.012, lng: lng + 0.008,
          },
          patientToHospitalEta: "5 mins",
          ambulanceToPatientEta: "3 mins",
          success: true,
        });
      }
      return;
    }

    setLogisticsLoading(true);
    setLogisticsResult(null);

    runLogisticsAgent(selectedCase.id, selectedCase.latitude, selectedCase.longitude, selectedCase.severity)
      .then((result) => { setLogisticsResult(result); setLogisticsLoading(false); })
      .catch(() => setLogisticsLoading(false));
  }, [selectedCase?.id, (selectedCase as any)?.logisticsDispatched]);

  const handleSendMessage = async (text: string) => {
    if (!selectedCase) return;
    try { await sendMessage(selectedCase.id, "dispatcher-1", "emergency", "Dispatcher", text); }
    catch (e) { console.error("Failed to send message:", e); }
  };

  const highCases = allCases.filter((c) => c.severity === "high" || c.severity === "critical");
  const activeDispatches = allCases.filter((c) => c.status === "dispatched" || c.status === "en-route").length;
  const isHighSeveritySelected = selectedCase?.severity === "critical" || selectedCase?.severity === "high";

  const STATS = [
    { label: "High Severity", value: highCases.length, icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    { label: "Dispatches", value: activeDispatches, icon: Truck, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Units Ready", value: "8", icon: Radio, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Personnel", value: "12", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  ];

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-72px)]">

      {/* ── Stats Bar ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${s.bg}`}
          >
            <div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">{s.label}</p>
              <p className="text-lg font-black text-slate-900 dark:text-white leading-none mt-0.5">{s.value}</p>
            </div>
            <s.icon size={18} className={s.color} />
          </motion.div>
        ))}
      </div>

      {/* ── Main Grid: 3 columns ──────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-3 flex-1 min-h-0">

        {/* ── LEFT: Priority Queue ────────────────────── 3 cols */}
        <div className="col-span-3 flex flex-col min-h-0">
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0 flex items-center gap-2">
              <AlertOctagon size={15} className="text-red-400" />
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Priority Queue</h2>
              {highCases.length > 0 && (
                <span className="ml-auto text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {highCases.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              <EmergencyCaseList onSelectCase={setSelectedCase} selectedId={selectedCase?.id || null} />
            </div>
          </div>
        </div>

        {/* ── CENTER: Map + Dispatch ──────────────────── 5 cols */}
        <div className="col-span-5 flex flex-col gap-3 min-h-0">

          {/* Map — always visible, fixed height */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            style={{ height: "52%" }}>
            <LiveMapView
              caseData={selectedCase}
              ambulance={logisticsResult?.ambulanceServices[0] || null}
              hospital={logisticsResult?.bestHospital || null}
            />
          </div>

          {/* Bottom area: Logistics + Dispatch — scrollable */}
          <div className="flex-1 flex flex-col gap-3 min-h-0 overflow-y-auto pr-0.5">

            {/* Logistics Agent Results */}
            <AnimatePresence>
              {selectedCase && isHighSeveritySelected && (
                <motion.div
                  key="logistics"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-500/20 shadow-sm overflow-hidden shrink-0"
                >
                  {/* Header */}
                  <button
                    onClick={() => setLogisticsExpanded(!logisticsExpanded)}
                    className="w-full px-4 py-3 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      🤖 Logistics Agent
                    </p>
                    {logisticsLoading && (
                      <span className="text-[10px] text-amber-500 font-mono animate-pulse ml-1">Scanning...</span>
                    )}
                    <span className="ml-auto">
                      {logisticsExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                    </span>
                  </button>

                  <AnimatePresence>
                    {logisticsExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          {logisticsLoading ? (
                            <div className="space-y-1.5 py-2">
                              {["Locking GPS...", "Scanning hospitals...", "Locating ambulances..."].map((step, i) => (
                                <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-500 animate-pulse">
                                  <div className="h-1 w-1 rounded-full bg-amber-500" />
                                  {step}
                                </div>
                              ))}
                            </div>
                          ) : logisticsResult ? (
                            <div className="grid grid-cols-2 gap-3">
                              {logisticsResult.bestHospital && (
                                <div className="p-3 rounded-xl bg-blue-500/8 border border-blue-500/20 space-y-1">
                                  <div className="flex items-center gap-1.5 text-blue-400 text-[9px] font-black uppercase tracking-widest">
                                    <Hospital size={10} /> Nearest Hospital
                                  </div>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{logisticsResult.bestHospital.name}</p>
                                  <p className="text-[10px] text-slate-500 leading-tight">{logisticsResult.bestHospital.address}</p>
                                  {logisticsResult.bestHospital.phone && (
                                    <a href={`tel:${logisticsResult.bestHospital.phone}`} className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold hover:underline">
                                      <Phone size={9} /> {logisticsResult.bestHospital.phone}
                                    </a>
                                  )}
                                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <Clock size={9} /> ETA: {logisticsResult.bestHospital.duration} ({logisticsResult.bestHospital.distance})
                                  </div>
                                </div>
                              )}
                              {logisticsResult.ambulanceServices[0] && (
                                <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 space-y-1">
                                  <div className="flex items-center gap-1.5 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                                    <Truck size={10} /> Nearest Ambulance
                                  </div>
                                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{logisticsResult.ambulanceServices[0].name}</p>
                                  {logisticsResult.ambulanceServices[0].phone && (
                                    <a href={`tel:${logisticsResult.ambulanceServices[0].phone}`} className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold hover:underline">
                                      <Phone size={9} /> {logisticsResult.ambulanceServices[0].phone}
                                    </a>
                                  )}
                                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <Clock size={9} /> Arrival: {logisticsResult.ambulanceServices[0].duration}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dispatch Panel */}
            {selectedCase && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 shrink-0">
                <DispatchPanel caseData={selectedCase} />
              </div>
            )}

            {/* Empty state */}
            {!selectedCase && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <Siren size={28} className="text-slate-400 mb-3" />
                <p className="text-sm font-semibold text-slate-500">Select a case</p>
                <p className="text-xs text-slate-400 mt-1">Pick a case from the queue to see dispatch options</p>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Intel / Med / Chat Tabs ────────── 4 cols */}
        <div className="col-span-4 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

          {/* Tab Header */}
          <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
            {([
              { id: "intel", label: "Intel", icon: Activity },
              { id: "med", label: "Med Protocol", icon: Brain },
              { id: "chat", label: "Live Chat", icon: MessageCircle },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-3 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all border-b-2",
                  activeTab === tab.id
                    ? "border-red-500 text-red-500 bg-red-500/5"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                )}
              >
                <tab.icon size={13} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col">

            {/* ── Intel Tab ── */}
            {activeTab === "intel" && (
              selectedCase ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Intel Report</h3>
                    {(() => {
                      const scoreLog = intelLogs.find(l => l.action === "CONFIDENCE_SCORED");
                      const score = scoreLog ? Math.round((scoreLog.confidence || 0) * 100) : null;
                      const color = score !== null
                        ? score >= 65 ? "bg-red-500/15 text-red-400 border-red-500/30"
                        : score >= 40 ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-500/15 text-slate-400 border-slate-500/30";
                      return score !== null ? (
                        <span className={cn("text-[9px] font-black px-2 py-0.5 rounded border", color)}>
                          {score}% CONFIDENCE
                        </span>
                      ) : null;
                    })()}
                  </div>

                  {intelLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Activity size={22} className="text-slate-400 mb-3 animate-pulse" />
                      <p className="text-[11px] text-slate-500 font-mono">Intel analysis pending...</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[180px]">Submit a new case to trigger signal fusion</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {intelLogs.map((log, i) => {
                        const isAlert = log.action?.includes("ALERT") || log.action?.includes("ESCALATED") || log.action?.includes("DETECTED");
                        const isScore = log.action === "CONFIDENCE_SCORED";
                        const isNoEsc = log.action === "NO_ESCALATION";
                        return (
                          <div key={log.id || i} className={cn(
                            "flex items-start gap-2 p-2.5 rounded-xl text-[11px] font-mono leading-snug border",
                            isAlert ? "bg-red-500/5 text-red-500 border-red-500/10" :
                            isScore ? "bg-blue-500/5 text-blue-400 font-bold border-blue-500/10" :
                            isNoEsc ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10" :
                            "bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border-transparent"
                          )}>
                            {log.action && (
                              <span className={cn(
                                "text-[8px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5",
                                isAlert ? "bg-red-500/20 text-red-400" :
                                isScore ? "bg-blue-500/20 text-blue-400" :
                                isNoEsc ? "bg-emerald-500/20 text-emerald-400" :
                                "bg-slate-500/15 text-slate-500"
                              )}>{log.action}</span>
                            )}
                            <span>{log.thought}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Activity size={22} className="text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500">Select a case to view Intel Report</p>
                </div>
              )
            )}

            {/* ── Med Protocol Tab ── */}
            {activeTab === "med" && (
              selectedCase ? (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Med Protocol</h3>

                  {/* AI Summary */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{selectedCase.aiSummary}</p>
                  </div>

                  {/* Medicines */}
                  {selectedCase.aiSuggestions?.filter((s) => s.includes("—")).length ? (
                    <div className="space-y-2">
                      <p className="text-[9px] uppercase tracking-widest text-purple-400 font-black flex items-center gap-1">
                        <Brain size={9} /> Doctor Review Medicines
                      </p>
                      {selectedCase.aiSuggestions.filter((s) => s.includes("—")).map((med, idx) => {
                        // Strip "FOR DOCTOR REVIEW ONLY" prefix
                        const cleaned = med.replace(/^FOR DOCTOR REVIEW ONLY\s*—\s*/i, "").trim();
                        const parts = cleaned.split("—").map((p) => p.trim());
                        return (
                          <div key={idx} className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
                            <p className="text-[11px] font-bold text-purple-400 flex items-start gap-1.5 mb-1.5">
                              <Pill size={11} className="mt-0.5 shrink-0" />
                              {parts[0]}
                            </p>
                            {parts.slice(1).map((part, pIdx) => (
                              <p key={pIdx} className="text-[10px] text-slate-600 dark:text-slate-400 pl-4 leading-relaxed border-l-2 border-purple-500/20 ml-1.5 mt-1">
                                {part}
                              </p>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 text-center py-6">No specific medicines flagged.</p>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <Brain size={22} className="text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500">Select a case to view Medical Protocol</p>
                </div>
              )
            )}

            {/* ── Chat Tab ── */}
            {activeTab === "chat" && (
              selectedCase ? (
                <div className="flex-1 flex flex-col h-full -m-4">
                  <RealtimeChat
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    currentUserId="dispatcher-1"
                    currentUserRole="emergency"
                    className="flex-1 border-0 h-full"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <MessageCircle size={22} className="text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500">Select a case to start communication</p>
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
