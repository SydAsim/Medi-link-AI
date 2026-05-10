// ============================================
// Real-time Chat Service (Firestore)
// NO composite indexes — all sorting client-side
// ============================================

import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type { ChatMessage, UserRole } from "@/types";

export async function sendMessage(
  caseId: string,
  senderId: string, // Kept for backwards compatibility
  senderRole: UserRole,
  senderName: string,
  message: string
): Promise<void> {
  const messagesRef = collection(db, "chats", caseId, "messages");
  
  await addDoc(messagesRef, {
    senderRole,
    senderName,
    message,
    timestamp: serverTimestamp(),
  });
}

export function subscribeToChatMessages(
  caseId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const messagesRef = collection(db, "chats", caseId, "messages");
  
  // WRONG: const q = query(messagesRef, orderBy("timestamp", "asc")); -> silent fail without index
  // RIGHT: fetch all, sort client-side
  
  return onSnapshot(
    messagesRef,
    (snapshot) => {
      const messages = snapshot.docs.map(
        (d) => ({ id: d.id, caseId, ...d.data() } as ChatMessage)
      );
      
      // Client-side sort
      messages.sort((a, b) => {
        // Handle serverTimestamp which might be null initially
        const timeA = a.timestamp || 0;
        const timeB = b.timestamp || 0;
        
        // If timestamp is an object (Firestore Timestamp) get the seconds
        const secA = typeof timeA === 'object' && timeA !== null && 'seconds' in timeA ? (timeA as any).seconds : timeA;
        const secB = typeof timeB === 'object' && timeB !== null && 'seconds' in timeB ? (timeB as any).seconds : timeB;
        
        return secA - secB;
      });
      
      callback(messages);
    },
    (error) => {
      // CAUTION: Always include this error callback!
      console.error("Chat error:", error);
      callback([]); // Don't crash — return empty array
    }
  );
}
