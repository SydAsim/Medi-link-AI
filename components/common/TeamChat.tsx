"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Send, Loader2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendTeamMessage, subscribeToTeamMessages } from "@/services/chatService";
import type { ChatMessage, UserRole } from "@/types";

interface TeamChatProps {
  caseId: string;
  senderId: string;
  senderRole: "doctor" | "emergency";
  senderName: string;
}

export function TeamChat({ caseId, senderId, senderRole, senderName }: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToTeamMessages(caseId, (msgs) => {
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
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      await sendTeamMessage(caseId, senderId, senderRole, senderName, newMsg.trim());
      setNewMsg("");
    } catch (err) {
      console.error("Failed to send team message:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] rounded-xl border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Medical Team Back-Channel</h3>
        </div>
        <span className="text-[10px] text-emerald-500/60 font-medium">Internal Only</span>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-emerald-500/20"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-40">
            <MessageSquare size={24} className="text-emerald-500 mb-2" />
            <p className="text-[10px] text-emerald-500">Secure channel established</p>
          </div>
        ) : (
          messages.map((m) => (
            <div 
              key={m.id}
              className={cn(
                "flex flex-col max-w-[90%]",
                m.senderRole === senderRole ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] font-bold text-emerald-500/70">
                  {m.senderRole === "doctor" ? "👨‍⚕️" : "🚑"} {m.senderName}
                </span>
              </div>
              <div 
                className={cn(
                  "text-[11px] px-2.5 py-1.5 rounded-lg border",
                  m.senderRole === senderRole
                    ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-100"
                    : "bg-slate-800/80 border-slate-700 text-slate-200"
                )}
              >
                {m.message}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-2 bg-emerald-500/10 border-t border-emerald-500/20">
        <div className="flex gap-2">
          <input
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            placeholder="Team coordination message..."
            className="flex-1 text-[11px] px-3 py-1.5 rounded-lg bg-slate-900/50 border border-emerald-500/20 text-emerald-100 placeholder:text-emerald-500/40 focus:outline-none focus:border-emerald-500/50"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMsg.trim()}
            className="p-1.5 rounded-lg bg-emerald-500 text-slate-900 hover:bg-emerald-400 disabled:opacity-50 transition-colors"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
