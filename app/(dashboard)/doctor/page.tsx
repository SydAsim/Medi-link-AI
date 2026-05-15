"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope, Brain, Users, Clock, TrendingUp, FileText, Activity,
  CheckCircle, MessageCircle, Loader2, Truck
} from "lucide-react";
import { CardWrapper } from "@/components/common/CardWrapper";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { DoctorCaseList } from "@/components/doctor/DoctorCaseList";
import { AIAnalysisPanel } from "@/components/doctor/AIAnalysisPanel";
import { PatientSafetyPanel } from "@/components/doctor/PatientSafetyPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatMsg, setChatMsg] = useState("");
  const [chatSending, setChatSending] = useState(false);

  // Subscribe to all cases for stats
  useEffect(() => {
    const unsub = subscribeToAllCases((cases) => {
      setAllCases(cases);
      // Keep selected case in sync with latest data
      if (selectedCase) {
        const latest = cases.find(c => c.id === selectedCase.id);
        if (latest) setSelectedCase(latest);
      }
    });
    return () => unsub();
  }, [selectedCase?.id]);

  // Subscribe to chat for selected case
  useEffect(() => {
    if (!selectedCase) { setChatMessages([]); return; }
    const unsub = subscribeToChatMessages(selectedCase.id, (msgs) => setChatMessages(msgs));
    return () => unsub();
  }, [selectedCase?.id]);

  // Stats
  const activeCases = allCases.filter((c) => c.status !== "completed" && c.status !== "closed");
  const criticalCount = allCases.filter((c) => c.severity === "critical" || c.severity === "high").length;
  const pendingCount = allCases.filter((c) => c.status === "pending").length;

  const handleStatusUpdate = async (status: CaseStatus) => {
    if (!selectedCase) return;
    setUpdating(true);
    try {
      await updateCaseStatus(selectedCase.id, status);
      setSelectedCase({ ...selectedCase, status });
    } catch (e) {
      console.error("Status update failed:", e);
      alert("Failed to update status");
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
    { key: "all", label: "Active" },
    { key: "critical", label: "Critical" },
    { key: "pending", label: "Pending" },
    { key: "assigned", label: "Assigned" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Stethoscope size={22} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Doctor Command Center</h1>
            <p className="text-xs text-slate-500">AI-assisted triage & case management</p>
          </div>
        </div>
        <Badge variant="success" className="self-start md:self-center px-3 py-1">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
          On Duty
        </Badge>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Cases", value: activeCases.length, icon: FileText, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Critical", value: criticalCount, icon: Activity, color: "text-red-400", bg: "bg-red-500/10" },
          { label: "Pending", value: pendingCount, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Total", value: allCases.length, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
        ].map((s, i) => (
          <CardWrapper key={s.label} delay={i * 0.05} className="!p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{s.value}</p>
              </div>
              <div className={cn("p-2.5 rounded-xl", s.bg)}>
                <s.icon size={18} className={s.color} />
              </div>
            </div>
          </CardWrapper>
        ))}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Case List — Left */}
        <div className="lg:col-span-5">
          <CardWrapper hover={false} className="!p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Cases</h2>
              </div>
              <Badge variant="secondary">{activeCases.length}</Badge>
            </div>
            {/* Filters */}
            <div className="flex gap-1.5 mb-3">
              {filters.map((f) => (
                <button key={f.key} type="button" onClick={() => setFilter(f.key)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all",
                    filter === f.key
                      ? "bg-red-500/15 text-red-400 border border-red-500/25"
                      : "text-slate-500 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800/50"
                  )}>
                  {f.label}
                </button>
              ))}
            </div>
            <DoctorCaseList onSelectCase={setSelectedCase} selectedId={selectedCase?.id || null} filter={filter} />
          </CardWrapper>
        </div>

        {/* Right Panel — Analysis + Actions + Chat */}
        <div className="lg:col-span-7 space-y-4">
          {/* AI Analysis */}
          <CardWrapper hover={false} className="!p-4 h-fit">
            <AIAnalysisPanel caseData={selectedCase} />
          </CardWrapper>

          {/* Actions — only when case selected */}
          {selectedCase && (
            <CardWrapper hover={false} className="!p-4">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-3">Case Actions</p>
              <div className="flex flex-wrap gap-2">
                {(["pending", "assigned", "in-progress", "dispatched", "resolved", "completed"] as CaseStatus[]).map((s) => (
                  <Button key={s} size="sm" variant={selectedCase.status === s ? "default" : "outline"}
                    onClick={() => handleStatusUpdate(s)} disabled={updating}
                    className="text-xs capitalize">
                    {updating ? <Loader2 size={12} className="animate-spin mr-1" /> : null}
                    {s}
                  </Button>
                ))}
              </div>
            </CardWrapper>
          )}

          {/* Patient Safety & History Context */}
          {selectedCase && (
            <CardWrapper hover={false} className="!p-4 border-l-4 border-l-red-500/50">
              <PatientSafetyPanel caseData={selectedCase} />
            </CardWrapper>
          )}

          {/* Chat */}
          {selectedCase && (
            <CardWrapper hover={false} className="!p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={14} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Chat with Patient</h3>
                <span className="text-[10px] text-slate-600 ml-auto">{chatMessages.length} msgs</span>
              </div>
              {/* Messages */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 mb-3 p-2 rounded-lg bg-slate-100 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-800">
                {chatMessages.length === 0 ? (
                  <p className="text-[10px] text-slate-600 text-center py-4">No messages yet</p>
                ) : chatMessages.map((m) => (
                  <div key={m.id} className={cn(
                    "text-[11px] px-2.5 py-1.5 rounded-md max-w-[85%]",
                    m.senderRole === "doctor"
                      ? "ml-auto bg-emerald-500/10 text-emerald-200 border border-emerald-500/10"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/50"
                  )}>
                    {m.senderRole !== "doctor" && <p className="text-[9px] font-medium text-blue-400 mb-0.5">{m.senderName}</p>}
                    {m.message}
                  </div>
                ))}
              </div>
              {/* Input */}
              <div className="flex gap-2">
                <input value={chatMsg} onChange={(e) => setChatMsg(e.target.value)}
                  placeholder="Message patient..."
                  className="flex-1 text-xs px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/30"
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()} />
                <Button size="sm" variant="success" onClick={handleSendChat} disabled={chatSending || !chatMsg.trim()}>
                  {chatSending ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
                </Button>
              </div>
            </CardWrapper>
          )}
        </div>
      </div>
    </div>
  );
}
