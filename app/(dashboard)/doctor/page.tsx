"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope, Brain, Users, Clock, Activity,
  FileText, CheckCircle2, MessageCircle, Loader2,
  ShieldCheck, ChevronRight
} from "lucide-react";
import { CardWrapper } from "@/components/common/CardWrapper";
import { DoctorCaseList } from "@/components/doctor/DoctorCaseList";
import { AIAnalysisPanel } from "@/components/doctor/AIAnalysisPanel";
import { PatientSafetyPanel } from "@/components/doctor/PatientSafetyPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { subscribeToAllCases, updateCaseStatus } from "@/services/caseService";
import { sendMessage, subscribeToChatMessages } from "@/services/chatService";
import { cn } from "@/lib/utils";
import type { PatientCase, ChatMessage, CaseStatus } from "@/types";

type Filter = "all" | "critical" | "pending" | "assigned";

export default function DoctorPage() {
  const [selectedCase, setSelectedCase] = useState<PatientCase | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [allCases, setAllCases] = useState<PatientCase[]>([]);
  const [updating, setUpdating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const [chatSending, setChatSending] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAllCases((cases) => {
      setAllCases(cases);
      if (selectedCase) {
        const latest = cases.find(c => c.id === selectedCase.id);
        if (latest) setSelectedCase(latest);
      }
    });
    return () => unsub();
  }, [selectedCase?.id]);

  useEffect(() => {
    if (!selectedCase) { setChatMessages([]); return; }
    const unsub = subscribeToChatMessages(selectedCase.id, (msgs) => setChatMessages(msgs));
    return () => unsub();
  }, [selectedCase?.id]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const isJunk = (c: PatientCase) =>
    c.isSpam ||
    c.aiSummary?.includes("The system could not identify a clear medical emergency") ||
    c.aiSummary?.includes("SYSTEM_NOTICE");

  const activeCases = allCases.filter(c => !isJunk(c) && c.status !== "completed" && c.status !== "closed");
  const criticalCount = allCases.filter(c => !isJunk(c) && (c.severity === "critical" || c.severity === "high")).length;
  const pendingCount = allCases.filter(c => !isJunk(c) && c.status === "pending").length;

  const handleStatusUpdate = async (status: CaseStatus) => {
    if (!selectedCase) return;
    setUpdating(true);
    try {
      await updateCaseStatus(selectedCase.id, status);
      setSelectedCase({ ...selectedCase, status });
    } catch (e) {
      console.error("Status update failed:", e);
    }
    setUpdating(false);
  };

  const handleSendChat = async () => {
    if (!chatMsg.trim() || !selectedCase) return;
    setChatSending(true);
    try {
      await sendMessage(selectedCase.id, "doctor-1", "doctor", "Dr. Physician", chatMsg.trim());
      setChatMsg("");
    } catch (e) { console.error("Chat send failed:", e); }
    setChatSending(false);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "all", label: "All Active" },
    { key: "critical", label: "Critical" },
    { key: "pending", label: "Pending" },
    { key: "assigned", label: "Assigned" },
  ];

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    pending:   { label: "Mark Pending",   color: "border-amber-500/40 text-amber-400 hover:bg-amber-500/10",   icon: Clock },
    assigned:  { label: "Mark Assigned",  color: "border-blue-500/40 text-blue-400 hover:bg-blue-500/10",     icon: Stethoscope },
    completed: { label: "Mark Completed", color: "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10", icon: CheckCircle2 },
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Stethoscope size={22} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Doctor Command Center</h1>
            <p className="text-xs text-slate-500">AI-assisted triage & case management</p>
          </div>
        </div>
        <Badge variant="success" className="px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
          On Duty
        </Badge>
      </motion.div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Cases",  value: activeCases.length,  icon: FileText,    color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Critical / High", value: criticalCount,    icon: Activity,    color: "text-red-400",     bg: "bg-red-500/10" },
          { label: "Pending Review", value: pendingCount,       icon: Clock,       color: "text-amber-400",   bg: "bg-amber-500/10" },
          { label: "Total Patients", value: allCases.length,   icon: Users,       color: "text-blue-400",    bg: "bg-blue-500/10" },
        ].map((s, i) => (
          <CardWrapper key={s.label} delay={i * 0.05} className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{s.value}</p>
              </div>
              <div className={cn("p-2.5 rounded-xl", s.bg)}>
                <s.icon size={18} className={s.color} />
              </div>
            </div>
          </CardWrapper>
        ))}
      </div>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Left — Case List */}
        <div className="lg:col-span-4">
          <CardWrapper hover={false} className="!p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Patient Queue</h2>
              </div>
              <Badge variant="secondary" className="text-[10px]">{activeCases.length} cases</Badge>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 mb-4 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
              {filters.map((f) => (
                <button key={f.key} type="button" onClick={() => setFilter(f.key)}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-all",
                    filter === f.key
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  )}>
                  {f.label}
                </button>
              ))}
            </div>

            <DoctorCaseList onSelectCase={setSelectedCase} selectedId={selectedCase?.id || null} filter={filter} />
          </CardWrapper>
        </div>

        {/* Center — AI Analysis only */}
        <div className="lg:col-span-5 space-y-4">
          {/* AI Analysis Panel */}
          <CardWrapper hover={false} className="!p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Brain size={15} className="text-purple-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">AI Clinical Analysis</h2>
              {selectedCase && (
                <div className="ml-auto">
                  <SeverityBadge severity={selectedCase.severity} />
                </div>
              )}
            </div>
            <AIAnalysisPanel caseData={selectedCase} />
          </CardWrapper>
        </div>

        {/* Right — Chat */}
        <div className="lg:col-span-3">
          <CardWrapper hover={false} className="!p-4 flex flex-col h-full">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <MessageCircle size={15} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Patient Chat</h3>
              {chatMessages.length > 0 && (
                <span className="ml-auto text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {chatMessages.length}
                </span>
              )}
            </div>

            {!selectedCase ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle size={28} className="text-slate-600 mb-3" />
                <p className="text-xs text-slate-500">Select a case to start chatting</p>
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-[320px] min-h-[160px] p-2 rounded-lg bg-slate-50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800">
                  {chatMessages.length === 0 ? (
                    <p className="text-[10px] text-slate-500 text-center py-6">No messages yet</p>
                  ) : chatMessages.map((m) => {
                    const isDoctor = m.senderRole === "doctor";
                    const isBot = m.senderName?.includes("CIRO") || m.senderName?.includes("Logistics");
                    return (
                      <div key={m.id} className={cn(
                        "text-[11px] px-3 py-2 rounded-lg leading-relaxed",
                        isDoctor
                          ? "ml-auto max-w-[85%] bg-emerald-600 dark:bg-emerald-500/20 text-white dark:text-emerald-200 border border-emerald-500/20 dark:border-emerald-500/15 text-right"
                          : isBot
                          ? "max-w-full bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-300"
                          : "max-w-[85%] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
                      )}>
                        {!isDoctor && (
                          <p className={cn("text-[9px] font-bold mb-0.5", isBot ? "text-amber-700 dark:text-amber-400" : "text-blue-600 dark:text-blue-400")}>
                            {isBot ? "🤖 " : ""}{m.senderName}
                          </p>
                        )}
                        <div className="whitespace-pre-line">{m.message}</div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <input
                    value={chatMsg}
                    onChange={(e) => setChatMsg(e.target.value)}
                    placeholder="Message patient..."
                    className="flex-1 text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/40"
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  />
                  <Button size="sm" variant="success" onClick={handleSendChat} disabled={chatSending || !chatMsg.trim()}>
                    {chatSending ? <Loader2 size={12} className="animate-spin" /> : <ChevronRight size={14} />}
                  </Button>
                </div>

                {/* Safety & History below chat */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={13} className="text-red-400" />
                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Safety & History</p>
                  </div>
                  <PatientSafetyPanel caseData={selectedCase} />
                </div>

                {/* Case Status below Safety */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Update Case Status</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["pending", "assigned", "completed"] as CaseStatus[]).map((s) => {
                      const cfg = statusConfig[s];
                      const isActive = selectedCase.status === s;
                      return (
                        <button key={s} onClick={() => handleStatusUpdate(s)} disabled={updating || isActive}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all",
                            isActive
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                              : cfg.color + " bg-transparent border"
                          )}>
                          {updating ? <Loader2 size={14} className="animate-spin" /> : <cfg.icon size={14} />}
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </CardWrapper>
        </div>
      </div>
    </div>
  );
}
