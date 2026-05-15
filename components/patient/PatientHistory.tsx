"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileText,
  Sparkles,
  Truck,
  Trash2,
  X as CloseIcon,
} from "lucide-react";
import { cn, getSeverityColor, getRelativeTime } from "@/lib/utils";
import { subscribeToCasesByPhone, deleteCase } from "@/services/caseService";
import { sendMessage, subscribeToChatMessages } from "@/services/chatService";
import { SituationalAdvice } from "@/components/patient/SituationalAdvice";
import type { PatientCase, ChatMessage } from "@/types";

interface PatientHistoryProps {
  phone: string;
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-amber-400", label: "Pending" },
  assigned: { icon: FileText, color: "text-blue-400", label: "Assigned" },
  "in-progress": { icon: Sparkles, color: "text-purple-400", label: "In Progress" },
  dispatched: { icon: Truck, color: "text-cyan-400", label: "Dispatched" },
  arrived: { icon: MapPin, color: "text-emerald-400", label: "Arrived" },
  completed: { icon: CheckCircle, color: "text-green-400", label: "Completed" },
  resolved: { icon: CheckCircle, color: "text-green-400", label: "Resolved" },
  closed: { icon: CheckCircle, color: "text-slate-600 dark:text-slate-400", label: "Closed" },
};

export function PatientHistory({ phone }: PatientHistoryProps) {
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Subscribe to cases by phone number
  useEffect(() => {
    if (!phone.trim()) {
      setCases([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = subscribeToCasesByPhone(phone.trim(), (data) => {
      setCases(data);
      setLoading(false);
    });

    return () => unsub();
  }, [phone]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={24} className="text-slate-500 animate-spin mb-3" />
        <p className="text-sm text-slate-500">Loading history...</p>
      </div>
    );
  }

  if (!phone.trim()) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText size={32} className="text-slate-700 mb-3" />
        <p className="text-sm text-slate-500">Enter your phone number to view case history</p>
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock size={32} className="text-slate-700 mb-3" />
        <p className="text-sm text-slate-500">No cases found for this number</p>
        <p className="text-xs text-slate-600 mt-1">Cases will appear here after submission</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {cases.map((c, i) => (
        <CaseCard
          key={c.id}
          caseData={c}
          index={i}
          expanded={expandedId === c.id}
          onToggle={() => setExpandedId(expandedId === c.id ? null : c.id)}
          phone={phone}
        />
      ))}
    </div>
  );
}

// ─── Case Card ───────────────────────────────────────────────
function CaseCard({
  caseData,
  index,
  expanded,
  onToggle,
  phone,
}: {
  caseData: PatientCase;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  phone: string;
}) {
  const status = statusConfig[caseData.status] || statusConfig.pending;
  const StatusIcon = status.icon;

  const actions = caseData.aiSuggestions || [];
  const medicines = actions.filter((a) => a.includes("—"));
  const otherActions = actions.filter((a) => !a.includes("—"));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/20 overflow-hidden"
    >
      <div className="relative group">
        {/* Header — clickable */}
        <button
          type="button"
          onClick={onToggle}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-100 dark:bg-slate-800/30 transition-colors text-left"
        >
          {/* Severity dot */}
          <div
            className={cn(
              "h-2.5 w-2.5 rounded-full flex-shrink-0",
              caseData.severity === "critical" || caseData.severity === "high"
                ? "bg-red-500"
                : caseData.severity === "medium"
                ? "bg-amber-500"
                : "bg-emerald-500"
            )}
          />

          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-800 dark:text-slate-200 truncate">{caseData.issueText}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-slate-500">
                {getRelativeTime(caseData.createdAt)}
              </span>
            </div>
          </div>

          {/* Expand icon */}
          <div className="flex items-center gap-2 pr-8"> {/* Added padding for delete button */}
            {expanded ? (
              <ChevronUp size={14} className="text-slate-500" />
            ) : (
              <ChevronDown size={14} className="text-slate-500" />
            )}
          </div>
        </button>

        {/* Delete button — Absolute positioned to avoid nesting */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this case record?")) {
              deleteCase(caseData.id);
            }
          }}
          className="absolute right-3 top-3 p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100 z-10"
          title="Delete record"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-slate-200 dark:border-slate-800">
              {/* Situational Advice */}
              <div className="mt-3">
                <SituationalAdvice caseData={caseData} />
              </div>

              {/* AI Summary & Medicines — only if EXPLICITLY approved by doctor */}
              {!caseData.protocolApproved ? (
                <div className="mt-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50">
                  <p className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                    <Clock size={10} /> Pending Doctor Review
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic">
                    Specific medicine recommendations will be visible once a doctor reviews and approves your case.
                  </p>
                </div>
              ) : (
                <div className="mt-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <p className="text-[10px] font-medium text-purple-400 mb-1 flex items-center gap-1">
                    <Sparkles size={10} /> Approved Medical Protocol
                  </p>
                  {caseData.aiSummary && <p className="text-xs text-slate-700 dark:text-slate-300 mb-2">{caseData.aiSummary}</p>}
                  {medicines.length > 0 && (
                    <ul className="space-y-1">
                      {medicines.map((s, i) => (
                        <li key={i} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-start gap-1.5">
                          <span className="text-purple-400 mt-0.5">💊</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Chat — only if assigned or further */}
              {caseData.status !== "pending" && (
                <div className="mt-3">
                  <CaseChat caseId={caseData.id} phone={phone} />
                </div>
              )}

              {/* Image */}
              {caseData.imageUrl && (
                <div className="rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700">
                  <img
                    src={caseData.imageUrl}
                    alt="Case image"
                    className="w-full max-h-40 object-cover"
                  />
                </div>
              )}

              {/* Location */}
              <div className="flex flex-col gap-1 text-[11px] text-slate-500">
                {caseData.address && (
                  <div className="flex items-start gap-2 text-slate-400">
                    <MapPin size={10} className="mt-0.5 flex-shrink-0" />
                    <span className="leading-tight">{caseData.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 opacity-70">
                  <MapPin size={10} className="flex-shrink-0" />
                  {caseData.latitude.toFixed(4)}, {caseData.longitude.toFixed(4)}
                  {caseData.accuracy > 0 && ` · ±${Math.round(caseData.accuracy)}m`}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Inline Chat ─────────────────────────────────────────────
export function CaseChat({ caseId, phone }: { caseId: string; phone: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const unsub = subscribeToChatMessages(caseId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [caseId]);

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    setSending(true);
    try {
      await sendMessage(caseId, phone, "patient", "Patient", newMsg.trim());
      setNewMsg("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-300 dark:border-slate-700/50 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800/40 border-b border-slate-300 dark:border-slate-700/50">
        <MessageCircle size={12} className="text-slate-500" />
        <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">Chat with Medical Team</span>
        {messages.length > 0 && (
          <span className="text-[10px] text-slate-600 ml-auto">{messages.length}</span>
        )}
      </div>

      {/* Messages */}
      <div className="max-h-40 overflow-y-auto p-2 space-y-1.5">
        {messages.length === 0 ? (
          <p className="text-[10px] text-slate-600 text-center py-3">
            No messages yet. Send a message to your medical team.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "text-[11px] px-2 py-1.5 rounded-md max-w-[85%]",
                m.senderRole === "patient"
                  ? "ml-auto bg-red-500/10 text-red-200 border border-red-500/10"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/50"
              )}
            >
              {m.senderRole !== "patient" && (
                <p className="text-[9px] font-medium text-emerald-400 mb-0.5">
                  {m.senderName} · {m.senderRole}
                </p>
              )}
              {m.message}
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="flex gap-1.5 p-2 border-t border-slate-300 dark:border-slate-700/50">
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          placeholder="Message..."
          className="flex-1 text-[11px] px-2 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-500/30"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !newMsg.trim()}
          className="px-2 py-1.5 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-40 transition-colors"
        >
          {sending ? <Loader2 size={12} className="animate-spin" /> : <MessageCircle size={12} />}
        </button>
      </div>
    </div>
  );
}
