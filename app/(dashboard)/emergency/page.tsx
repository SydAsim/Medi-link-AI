"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Siren, MapPin, Truck, AlertOctagon, Radio, Navigation,
  ShieldAlert, Users, Brain, Pill, Activity, MessageCircle,
  Phone, Hospital, Clock, CheckCircle2
} from "lucide-react";
import { CardWrapper } from "@/components/common/CardWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmergencyCaseList } from "@/components/emergency/EmergencyCaseList";
import { DispatchPanel } from "@/components/emergency/DispatchPanel";
import { LiveMapView } from "@/components/emergency/LiveMapView";
import { RealtimeChat } from "@/components/common/RealtimeChat";
import { subscribeToAllCases } from "@/services/caseService";
import { subscribeToChatMessages, sendMessage } from "@/services/chatService";
import { subscribeToIntelligenceLogs } from "@/services/ciroService";
import { runLogisticsAgent, type LogisticsResult, type NearbyFacility } from "@/services/logisticsAgent";
import { cn } from "@/lib/utils";
import type { PatientCase, ChatMessage, IntelligenceLog } from "@/types";

export default function EmergencyPage() {
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [allCases, setAllCases] = useState<PatientCase[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Logistics Agent state
  const [logisticsResult, setLogisticsResult] = useState<LogisticsResult | null>(null);
  const [logisticsLoading, setLogisticsLoading] = useState(false);
  const [dispatched, setDispatched] = useState(false);

  // Intel Agent report & Tabs state
  const [intelLogs, setIntelLogs] = useState<IntelligenceLog[]>([]);
  const [activeTab, setActiveTab] = useState<"intel" | "med" | "chat">("intel");

  useEffect(() => {
    const unsub = subscribeToAllCases((cases) => setAllCases(cases));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedCase) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToChatMessages(selectedCase.id, (msgs) => setMessages(msgs));
    return () => unsub();
  }, [selectedCase?.id]);

  // Subscribe to Intel Agent logs for selected case
  useEffect(() => {
    if (!selectedCase) { setIntelLogs([]); return; }
    const unsub = subscribeToIntelligenceLogs(selectedCase.id, "case", (logs) => {
      setIntelLogs(logs.filter(l => l.agentName === "IntelAgent"));
    });
    return () => unsub();
  }, [selectedCase?.id]);

  // 🚑 Auto-run Logistics Agent — only once per case (checks Firestore flag)
  useEffect(() => {
    if (!selectedCase) return;
    const isHighSeverity = selectedCase.severity === "critical" || selectedCase.severity === "high";
    if (!isHighSeverity) { setLogisticsResult(null); setDispatched(false); return; }

    // ✅ Already processed — just show cached mock result, DO NOT re-run agent
    if ((selectedCase as any).logisticsDispatched) {
      if (!logisticsResult) {
        // Populate UI with cached mock data so emergency team can still see info
        const { lat, lng } = { lat: selectedCase.latitude, lng: selectedCase.longitude };
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

    // 🆕 New case — run the full agent once
    setLogisticsLoading(true);
    setDispatched(false);
    setLogisticsResult(null);

    runLogisticsAgent(
      selectedCase.id,
      selectedCase.latitude,
      selectedCase.longitude,
      selectedCase.severity
    ).then((result) => {
      setLogisticsResult(result);
      setLogisticsLoading(false);
    }).catch(() => setLogisticsLoading(false));
  }, [selectedCase?.id, (selectedCase as any)?.logisticsDispatched]);

  const handleSendMessage = async (text: string) => {
    if (!selectedCase) return;
    try {
      await sendMessage(selectedCase.id, "dispatcher-1", "emergency", "Dispatcher", text);
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  };

  const handleDispatchAmbulance = async () => {
    if (!selectedCase || !logisticsResult?.ambulanceServices[0]) return;
    setDispatched(true);
    await sendMessage(
      selectedCase.id,
      "logistics-agent",
      "emergency",
      "🤖 CIRO Logistics Agent",
      `🚑 Ambulance has been DISPATCHED from ${logisticsResult.ambulanceServices[0].name}. ETA to your location: **${logisticsResult.ambulanceToPatientEta}**. Please remain at your current location.`
    );
  };

  const highCases = allCases.filter((c) => c.severity === "high" || c.severity === "critical");
  const activeDispatches = allCases.filter((c) => c.status === "dispatched" || c.status === "en-route").length;
  const isHighSeveritySelected = selectedCase?.severity === "critical" || selectedCase?.severity === "high";

  return (
    <div className="space-y-4 h-[calc(100vh-80px)] flex flex-col">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {[
          { label: "High Severity", value: highCases.length, icon: ShieldAlert, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "Active Dispatches", value: activeDispatches, icon: Truck, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Units Available", value: "8", icon: Radio, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Active Personnel", value: "12", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        ].map((s, i) => (
          <CardWrapper key={s.label} delay={i * 0.05} className="!p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium mb-1">{s.label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white leading-none">{s.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon size={16} className={s.color} />
              </div>
            </div>
          </CardWrapper>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">

        {/* Left Column: Case List */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <CardWrapper className="flex-1 flex flex-col p-3 min-h-0 border-red-500/20">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <AlertOctagon size={16} className="text-red-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Priority Queue</h2>
            </div>
            <div className="flex-1 overflow-hidden">
              <EmergencyCaseList onSelectCase={setSelectedCase} selectedId={selectedCase?.id || null} />
            </div>
          </CardWrapper>
        </div>

        {/* Center Column: Map & Dispatch */}
        <div className="lg:col-span-6 flex flex-col gap-4 min-h-0">
          {/* Map */}
          <CardWrapper className="flex-[3] p-0 overflow-hidden flex flex-col min-h-0">
            <LiveMapView
              caseData={selectedCase}
              ambulance={logisticsResult?.ambulanceServices[0] || null}
              hospital={logisticsResult?.bestHospital || null}
              dispatched={dispatched}
            />
          </CardWrapper>

          {/* Logistics Agent Results Panel */}
          <AnimatePresence>
            {selectedCase && isHighSeveritySelected && (
              <motion.div
                key="logistics-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CardWrapper hover={false} className="!p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      🤖 Logistics Agent
                    </p>
                    {logisticsLoading && (
                      <span className="text-[10px] text-amber-500 font-mono animate-pulse ml-auto">
                        Scanning resources...
                      </span>
                    )}
                  </div>

                  {logisticsLoading ? (
                    <div className="space-y-2">
                      {["Identifying GPS...", "Scanning hospitals...", "Locating ambulances..."].map((step, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] font-mono text-slate-500 animate-pulse">
                          <div className="h-1 w-1 rounded-full bg-amber-500" />
                          {step}
                        </div>
                      ))}
                    </div>
                  ) : logisticsResult ? (
                    <div className="grid grid-cols-2 gap-3">
                      {/* Best Hospital */}
                      {logisticsResult.bestHospital && (
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-1">
                          <div className="flex items-center gap-1.5 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            <Hospital size={11} />
                            Nearest Hospital
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{logisticsResult.bestHospital.name}</p>
                          <p className="text-[10px] text-slate-500">{logisticsResult.bestHospital.address}</p>
                          {logisticsResult.bestHospital.phone && (
                            <a href={`tel:${logisticsResult.bestHospital.phone}`}
                              className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold hover:underline">
                              <Phone size={9} />
                              {logisticsResult.bestHospital.phone}
                            </a>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock size={9} />
                            ETA: {logisticsResult.bestHospital.duration} ({logisticsResult.bestHospital.distance})
                          </div>
                        </div>
                      )}

                      {/* Ambulance */}
                      {logisticsResult.ambulanceServices[0] && (
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                            <Truck size={11} />
                            Nearest Ambulance
                          </div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{logisticsResult.ambulanceServices[0].name}</p>
                          {logisticsResult.ambulanceServices[0].phone && (
                            <a href={`tel:${logisticsResult.ambulanceServices[0].phone}`}
                              className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold hover:underline">
                              <Phone size={9} />
                              {logisticsResult.ambulanceServices[0].phone}
                            </a>
                          )}
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock size={9} />
                            Arrival ETA: {logisticsResult.ambulanceServices[0].duration}
                          </div>

                        </div>
                      )}
                    </div>
                  ) : null}
                </CardWrapper>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Standard Dispatch Panel */}
          {selectedCase && (
            <CardWrapper hover={false} className="!p-4 h-fit">
              <DispatchPanel caseData={selectedCase} />
            </CardWrapper>
          )}
        </div>

        {/* Right Column: Intel Report + Med Info & Chat */}
        <div className="lg:col-span-3 flex flex-col min-h-0 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* Tabs Header */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
            {[
              { id: "intel", label: "Intel Report", icon: Activity },
              { id: "med", label: "Med Protocol", icon: Brain },
              { id: "chat", label: "Live Chat", icon: MessageCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 py-3 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors",
                  activeTab === tab.id
                    ? "bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white border-b-2 border-red-500"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                )}
              >
                <tab.icon size={14} className={activeTab === tab.id ? "text-red-500" : ""} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 flex flex-col">
            {/* Intel Agent Report Tab */}
            {activeTab === "intel" && (
              selectedCase ? (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Intel Report</h3>
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
                          CONFIDENCE: {score}%
                        </span>
                      ) : null;
                    })()}
                  </div>
                  
                  {intelLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center m-auto">
                      <Activity size={24} className="text-slate-400 mb-3 animate-pulse" />
                      <p className="text-[11px] text-slate-500 font-mono">Intel analysis pending...</p>
                      <p className="text-[10px] text-slate-400 mt-2 max-w-[200px]">Submit a new case to see the full signal fusion report</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {intelLogs.map((log, i) => {
                        const isAlert = log.action?.includes("ALERT") || log.action?.includes("ESCALATED") || log.action?.includes("DETECTED");
                        const isScore = log.action === "CONFIDENCE_SCORED";
                        const isNoEsc = log.action === "NO_ESCALATION";
                        return (
                          <div key={log.id || i} className={cn(
                            "flex items-start gap-2 p-2 rounded-lg text-[11px] font-mono leading-snug border",
                            isAlert ? "bg-red-500/5 text-red-500 border-red-500/10" :
                            isScore ? "bg-blue-500/5 text-blue-400 font-bold border-blue-500/10" :
                            isNoEsc ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10" :
                            "bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 border-transparent"
                          )}>
                            {log.action ? (
                              <span className={cn(
                                "text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0 mt-0.5",
                                isAlert ? "bg-red-500/20 text-red-400" :
                                isScore ? "bg-blue-500/20 text-blue-400" :
                                isNoEsc ? "bg-emerald-500/20 text-emerald-400" :
                                "bg-slate-500/15 text-slate-500"
                              )}>{log.action}</span>
                            ) : (
                              <span className="text-slate-400 shrink-0 mt-0.5">&gt;</span>
                            )}
                            <span>{log.thought}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <Activity size={24} className="text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 text-center">Select a case to view Intelligence Report</p>
                </div>
              )
            )}

            {/* Med Protocol Tab */}
            {activeTab === "med" && (
              selectedCase ? (
                <div className="flex flex-col">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase mb-3 shrink-0">Med Protocol</h3>
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3 rounded-lg">{selectedCase.aiSummary}</p>
                    {selectedCase.aiSuggestions?.filter((s) => s.includes("—")).map((med, idx) => {
                      const parts = med.split("—").map((p) => p.trim());
                      return (
                        <div key={idx} className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                          <p className="text-[11px] font-bold text-purple-400 flex items-start gap-1.5 mb-1.5">
                            <Pill size={12} className="mt-0.5 shrink-0" />
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
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <Brain size={24} className="text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 text-center">Select a case to view Medical Protocol</p>
                </div>
              )
            )}

            {/* Chat Tab */}
            {activeTab === "chat" && (
              selectedCase ? (
                <div className="flex-1 flex flex-col h-full">
                  <RealtimeChat
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    currentUserId="dispatcher-1"
                    currentUserRole="emergency"
                    className="flex-1 border-0 h-full"
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <MessageCircle size={24} className="text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="text-xs text-slate-500 text-center">Select a case to communicate</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
