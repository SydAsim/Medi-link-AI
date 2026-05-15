"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Siren, MapPin, Truck, AlertOctagon, Radio, Navigation, ShieldAlert, Users, Brain, Pill, Activity, MessageCircle } from "lucide-react";
import { CardWrapper } from "@/components/common/CardWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmergencyCaseList } from "@/components/emergency/EmergencyCaseList";
import { DispatchPanel } from "@/components/emergency/DispatchPanel";
import { LiveMapView } from "@/components/emergency/LiveMapView";
import { RealtimeChat } from "@/components/common/RealtimeChat";
import { subscribeToAllCases } from "@/services/caseService";
import { subscribeToChatMessages, sendMessage } from "@/services/chatService";
import type { PatientCase, ChatMessage } from "@/types";

export default function EmergencyPage() {
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [allCases, setAllCases] = useState<PatientCase[]>([]);
  
  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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

  const handleSendMessage = async (text: string) => {
    if (!selectedCase) return;
    try {
      await sendMessage(selectedCase.id, "dispatcher-1", "emergency", "Dispatcher", text);
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  };

  const highCases = allCases.filter(c => c.severity === "high" || c.severity === "critical");
  const activeDispatches = allCases.filter(c => c.status === "dispatched" || c.status === "en-route").length;

  return (
    <div className="space-y-4 h-[calc(100vh-80px)] flex flex-col">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <Siren size={24} className="text-red-400" />
            </div>
            Emergency Dispatch Hub
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            High-severity incident management and ambulance routing
          </p>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-sm text-red-400 font-medium">
             <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
             LIVE FEED
           </div>
        </div>
      </motion.div>

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
            <LiveMapView caseData={selectedCase} />
          </CardWrapper>
          
          {/* Dispatch Panel */}
          {selectedCase && (
            <CardWrapper hover={false} className="!p-4 h-fit">
              <DispatchPanel caseData={selectedCase} />
            </CardWrapper>
          )}
        </div>

        {/* Right Column: Med Info & Chat */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
           
           {/* Med Protocol (Condensed AI Panel) */}
           {selectedCase && (
             <CardWrapper className="shrink-0 p-3 max-h-[40%] overflow-y-auto bg-white dark:bg-slate-900 border-purple-500/20">
               <div className="flex items-center gap-2 mb-2 sticky top-0 bg-white dark:bg-slate-900 z-10 pb-1">
                 <Brain size={14} className="text-purple-400" />
                 <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase">Med Protocol</h3>
               </div>
               <div className="space-y-2">
                 <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">{selectedCase.aiSummary}</p>
                 
                 {selectedCase.aiSuggestions?.filter(s => s.includes("—")).map((med, idx) => {
                   const parts = med.split("—").map(p => p.trim());
                   return (
                     <div key={idx} className="p-2 rounded bg-purple-500/10 border border-purple-500/20">
                       <p className="text-[10px] font-bold text-purple-300 flex items-start gap-1">
                         <Pill size={10} className="mt-0.5 shrink-0" />
                         {parts[0]}
                       </p>
                       {parts.slice(1).map((part, pIdx) => (
                         <p key={pIdx} className="text-[9px] text-slate-600 dark:text-slate-400 pl-3 leading-tight border-l border-purple-500/20 ml-1 mt-0.5">
                           {part}
                         </p>
                       ))}
                     </div>
                   )
                 })}
               </div>
             </CardWrapper>
           )}

           {/* Chat - Prominent */}
           <div className="flex-1 flex flex-col min-h-[300px]">
             {selectedCase ? (
               <RealtimeChat
                 messages={messages}
                 onSendMessage={handleSendMessage}
                 currentUserId="dispatcher-1"
                 currentUserRole="emergency"
                 className="flex-1 border-blue-500/20"
               />
             ) : (
               <CardWrapper className="flex-1 flex flex-col items-center justify-center p-4 border-dashed border-slate-300 dark:border-slate-700">
                  <MessageCircle size={24} className="text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500 text-center">Select a case to communicate with the patient and field team</p>
               </CardWrapper>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}
