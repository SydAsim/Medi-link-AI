// ============================================
// Real-time Chat Service (Firestore)
// NO composite indexes — all sorting client-side
// ============================================

import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type { ChatMessage, UserRole } from "@/types";

export async function sendMessage(
  caseId: string,
  senderId: string,
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
  // Remove orderBy to avoid index requirements
  const q = query(messagesRef);
  
  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs
        .map((d) => ({ id: d.id, caseId, ...d.data() } as ChatMessage))
        .sort((a, b) => {
          const tA = a.timestamp?.toMillis?.() || 0;
          const tB = b.timestamp?.toMillis?.() || 0;
          return tA - tB;
        });
      callback(messages);
    },
    (error) => {
      console.error("Chat error:", error);
      callback([]);
    }
  );
}
export async function sendTeamMessage(
  caseId: string,
  senderId: string,
  senderRole: UserRole,
  senderName: string,
  message: string
): Promise<void> {
  const messagesRef = collection(db, "chats", caseId, "team-messages");
  
  await addDoc(messagesRef, {
    senderRole,
    senderName,
    message,
    timestamp: serverTimestamp(),
  });
}

export function subscribeToTeamMessages(
  caseId: string,
  callback: (messages: ChatMessage[]) => void
): () => void {
  const messagesRef = collection(db, "chats", caseId, "team-messages");
  const q = query(messagesRef);
  
  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs
        .map((d) => ({ id: d.id, caseId, ...d.data() } as ChatMessage))
        .sort((a, b) => {
          const tA = a.timestamp?.toMillis?.() || 0;
          const tB = b.timestamp?.toMillis?.() || 0;
          return tA - tB;
        });
      callback(messages);
    },
    (error) => {
      console.error("Team chat error:", error);
      callback([]);
    }
  );
}
