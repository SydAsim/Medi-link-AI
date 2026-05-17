// ============================================
// Social Signals Demo Seeder
// Seeds Firestore social_signals_demo with
// realistic mock social/news signals near
// Peshawar, Pakistan for hackathon demos.
// ============================================

import { db } from "@/firebase/config";
import { collection, getDocs, addDoc, query, limit, serverTimestamp } from "firebase/firestore";

const DEMO_SIGNALS = [
  {
    topic: "Road accident near University Road",
    source: "Twitter / X",
    lat: 33.9888,
    lng: 71.4747,
    active: true,
    count: 8,
  },
  {
    topic: "Heavy flooding in Hayatabad Phase 4",
    source: "Facebook",
    lat: 33.9600,
    lng: 71.4400,
    active: true,
    count: 14,
  },
  {
    topic: "Road blocked near University Road intersection",
    source: "WhatsApp Community",
    lat: 33.9880,
    lng: 71.4750,
    active: true,
    count: 6,
  },
  {
    topic: "Multiple vehicles stopped on GT Road — possible accident",
    source: "Twitter / X",
    lat: 33.9700,
    lng: 71.5200,
    active: true,
    count: 4,
  },
  {
    topic: "Smoke visible near Saddar area — fire suspected",
    source: "News Report",
    lat: 34.0050,
    lng: 71.5600,
    active: true,
    count: 3,
  },
  {
    topic: "People rushing to Lady Reading Hospital — emergency reported",
    source: "Facebook",
    lat: 34.0060,
    lng: 71.5650,
    active: true,
    count: 9,
  },
  {
    topic: "Waterlogging on Ring Road after heavy rain",
    source: "Twitter / X",
    lat: 33.9750,
    lng: 71.4500,
    active: true,
    count: 11,
  },
];

/**
 * Seeds social_signals_demo with demo data if collection is empty.
 * Safe to call on every page load — only runs if collection is empty.
 */
export async function seedSocialSignalsIfEmpty(): Promise<void> {
  try {
    const snap = await getDocs(query(collection(db, "social_signals_demo"), limit(1)));
    if (!snap.empty) return; // Already seeded

    console.log("[SocialSignalSeeder] Seeding demo social signals...");
    await Promise.all(
      DEMO_SIGNALS.map((signal) =>
        addDoc(collection(db, "social_signals_demo"), {
          ...signal,
          createdAt: Date.now(),
          serverTimestamp: serverTimestamp(),
        })
      )
    );
    console.log(`[SocialSignalSeeder] Seeded ${DEMO_SIGNALS.length} demo signals.`);
  } catch (e) {
    console.warn("[SocialSignalSeeder] Failed to seed:", e);
  }
}
