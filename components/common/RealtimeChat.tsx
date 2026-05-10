"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatMessage, UserRole } from "@/types";

interface RealtimeChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentUserId: string;
  currentUserRole: UserRole;
  className?: string;
}

export function RealtimeChat({
  messages,
  onSendMessage,
  currentUserId,
  currentUserRole,
  className,
}: RealtimeChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage.trim());
    setNewMessage("");
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "patient":
        return "text-blue-400";
      case "doctor":
        return "text-emerald-400";
      case "emergency":
        return "text-red-400";
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
        <MessageCircle size={16} className="text-red-400" />
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Live Chat</span>
        <span className="ml-auto text-xs text-slate-500">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[400px]">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col",
                msg.senderId === currentUserId ? "items-end" : "items-start"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-medium mb-1",
                  getRoleColor(msg.senderRole)
                )}
              >
                {msg.senderName} · {msg.senderRole}
              </span>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm max-w-[80%]",
                  msg.senderId === currentUserId
                    ? "bg-red-600/20 text-red-100 border border-red-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700"
                )}
              >
                {msg.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim()}
        >
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
