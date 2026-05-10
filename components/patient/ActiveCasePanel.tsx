"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, MessageCircle, Send, Loader2, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { subscribeToChatMessages, sendMessage } from "@/services/chatService";
import type { PatientCase, ChatMessage } from "@/types";

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: "text-amber-400", label: "Pending" },
  assigned: { color: "text-blue-400", label: "Assigned" },
  "in-progress": { color: "text-purple-400", label: "In Progress" },
  dispatched: { color: "text-cyan-400", label: "Dispatched" },
  arrived: { color: "text-emerald-400", label: "Arrived" },
  completed: { color: "text-green-400", label: "Completed" },
  resolved: { color: "text-green-400", label: "Resolved" },
  closed: { color: "text-slate-600 dark:text-slate-400", label: "Closed" },
};

export function ActiveEmergencyAlert({ caseData }: { caseData: PatientCase }) {
  const status = statusConfig[caseData.status] || statusConfig.pending;
  const actions = caseData.aiSuggestions || [];
  const otherActions = actions.filter((a) => !a.includes("—"));

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Status</span>
          <span className={cn("text-xs font-bold flex items-center gap-1", status.color)}>
            <Clock size={12} /> {status.label}
          </span>
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{caseData.issueText}</p>
      </div>
    </div>
  );
}

export function ActiveCaseChat({ caseId, phone }: { caseId: string; phone: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToChatMessages(caseId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsub();
  }, [caseId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const hasMessages = messages.length > 0;

  return (
    <div className="relative h-full">
      <motion.div 
        className="flex flex-col h-[500px] rounded-2xl border border-blue-500/30 bg-white dark:bg-slate-900/80 shadow-xl overflow-hidden relative"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-3 px-5 py-4 bg-blue-500/10 dark:bg-blue-500/20 border-b border-blue-500/20">
          <div className="relative">
            <div className="p-2 rounded-full bg-blue-500/20 text-blue-500">
              <MessageCircle size={20} />
            </div>
            {hasMessages && (
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse border-2 border-white dark:border-slate-900" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Medical Team Chat</h3>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              {hasMessages ? "Doctor is communicating with you" : "Waiting for doctor review..."}
            </p>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/50"
        >
          {!hasMessages ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <Clock size={32} className="text-slate-400 mb-3" />
              <p className="text-xs text-slate-500 max-w-[200px]">
                You can leave a message for the doctor, or wait for them to respond here.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <motion.div
                initial={{ opacity: 0, x: m.senderRole === "patient" ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={m.id}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  m.senderRole === "patient" ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {m.senderRole !== "patient" && (
                  <span className="text-[10px] font-bold text-blue-500 mb-1 ml-1 flex items-center gap-1">
                    {m.senderRole === "doctor" ? "👨‍⚕️" : "🚑"} {m.senderName}
                  </span>
                )}
                <div
                  className={cn(
                    "text-sm px-3.5 py-2.5 rounded-2xl shadow-sm",
                    m.senderRole === "patient"
                      ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 rounded-tr-sm"
                      : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm"
                  )}
                >
                  {m.message}
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <div className="flex gap-2 relative">
            <input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 text-sm px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:outline-none focus:border-blue-500/30 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-200"
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !newMsg.trim()}
              className="px-4 rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500 transition-colors flex items-center justify-center shadow-md shadow-blue-500/20"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
