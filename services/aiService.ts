"use client";
// ============================================
// AI Triage Service — Gemini 2.0 Flash (Primary) + OpenAI (Fallback)
// Pharmaceutical-grade medicine recommendations
// ============================================

import type { AIAnalysis, Severity } from "@/types";

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const TRIAGE_PROMPT = `You are an emergency medical triage AI with pharmaceutical expertise.

CRITICAL FORMAT: For EVERY medicine, use EXACTLY this format:
Chemical Name (Brand Name) — Exact Dose in mg/ml — Route — Frequency — Stomach instruction — Adult dose — Purpose

Example:
"Amoxicillin + Clavulanic Acid (Augmentin) — 625mg oral tablet — Take 1 tablet every 8 hours — Take at start of meal — Complete full 7-day course — Adult dose — Broad-spectrum antibiotic to prevent wound infection"

NEVER return vague medicines without full dosage details.

Respond ONLY with valid JSON, no markdown:
{
  "possibleConditions": ["condition1"],
  "recommendedActions": ["Medicine Name (Brand) — dose — route — frequency — stomach — adult — purpose", "Next action"],
  "triageLevel": "critical|high|medium|low",
  "confidence": 0.0-1.0,
  "summary": "Clinical summary",
  "requiresImmediate": true|false
}`;

// ─── Condition-Specific Fallbacks ────────────────────────────
const FALLBACKS: Record<string, AIAnalysis> = {
  wound: {
    possibleConditions: ["Open wound/Laceration", "Infection risk"],
    recommendedActions: [
      "Diclofenac Sodium (Voltaren) — 50mg oral tablet — every 8 hrs for 3-5 days — after food — Adult dose — Pain & inflammation",
      "Amoxicillin + Clavulanic Acid (Augmentin) — 625mg oral tablet — every 8 hrs for 7 days — start of meal — Adult dose — Prevent wound infection",
      "Povidone-Iodine (Betadine) — 10% topical solution — apply 2-3x daily — external only — Adult dose — Antiseptic wound cleaning",
      "Apply direct pressure with clean cloth to control bleeding",
      "Tetanus Toxoid vaccine if not updated in 5 years",
    ],
    triageLevel: "high", confidence: 0.75,
    summary: "Open wound requiring cleaning, antibiotics, and pain management. Clean with Betadine, apply sterile dressing. Start Augmentin immediately if wound is deep.",
    requiresImmediate: true,
  },
  cardiac: {
    possibleConditions: ["Acute Coronary Syndrome", "Angina Pectoris", "Myocardial Infarction risk"],
    recommendedActions: [
      "Aspirin (Disprin) — 300mg chewable tablet — CHEW immediately — can take on empty stomach — Single loading dose — Antiplatelet to prevent clot",
      "Nitroglycerin (Nitrostat) — 0.4mg sublingual tablet — under tongue, repeat every 5 min up to 3 doses — sublingual only — Adult dose — Vasodilator for chest pain",
      "Clopidogrel (Plavix) — 300mg loading dose — 4x75mg tablets once — with or without food — Single loading dose — Antiplatelet for acute coronary",
      "Call emergency services immediately — do NOT drive",
      "Sit upright, loosen tight clothing, stay calm",
    ],
    triageLevel: "critical", confidence: 0.85,
    summary: "LIFE-THREATENING cardiac event. Administer Aspirin 300mg chewed IMMEDIATELY. Nitroglycerin sublingual if available. ACTIVATE EMS NOW.",
    requiresImmediate: true,
  },
  breathing: {
    possibleConditions: ["Acute Asthma Exacerbation", "Bronchospasm", "Respiratory Distress"],
    recommendedActions: [
      "Salbutamol (Ventolin) — 100mcg/puff MDI — 4-8 puffs via spacer every 20 min for 1 hr — inhaled — Adult dose — Rapid bronchodilator",
      "Prednisolone (Deltacortril) — 40mg oral tablet — once daily for 5 days — after breakfast — Adult dose — Reduce airway inflammation",
      "Ipratropium Bromide (Atrovent) — 20mcg/puff MDI — 4 puffs every 4-6 hrs — inhaled — Adult dose — Anticholinergic bronchodilator",
      "Sit patient upright, lean slightly forward",
      "Monitor SpO2 — if <92%, escalate to emergency immediately",
    ],
    triageLevel: "high", confidence: 0.8,
    summary: "Acute respiratory distress. Administer Salbutamol immediately via spacer. Start Prednisolone orally. If no improvement in 20 minutes, escalate to emergency.",
    requiresImmediate: true,
  },
  fracture: {
    possibleConditions: ["Possible fracture", "Severe sprain", "Musculoskeletal trauma"],
    recommendedActions: [
      "Tramadol (Tramal) — 50mg oral capsule — every 6 hrs as needed — with food — Max 400mg/day — Adult dose — Opioid analgesic for moderate-severe pain",
      "Diclofenac Sodium (Voltaren) — 75mg IM injection — single intramuscular dose — N/A — Adult dose — Rapid NSAID for acute trauma",
      "Omeprazole (Losec) — 20mg oral capsule — once daily before breakfast — empty stomach — Adult dose — Gastric protection with NSAIDs",
      "Immobilize limb — do NOT attempt to realign",
      "Apply ice wrapped in cloth for 20 min every hour",
    ],
    triageLevel: "high", confidence: 0.7,
    summary: "Suspected fracture. DO NOT move limb. Apply ice, elevate if possible. X-ray required. Start Tramadol for pain management immediately.",
    requiresImmediate: true,
  },
  fever: {
    possibleConditions: ["Viral fever", "Upper respiratory infection", "Influenza"],
    recommendedActions: [
      "Paracetamol (Panadol) — 500mg oral tablet — 1-2 tablets every 6 hrs — with or without food — Max 4g/day — Adult dose — Antipyretic and analgesic",
      "Cetirizine (Zyrtec) — 10mg oral tablet — once at bedtime — with or without food — Adult dose — Antihistamine for rhinitis/congestion",
      "ORS (Oral Rehydration Salt) — 1 sachet in 1L water — sip throughout day — oral — Adult dose — Prevent dehydration",
      "Rest and adequate fluid intake (2-3 liters/day)",
      "Seek medical attention if fever >39.5°C or persists >3 days",
    ],
    triageLevel: "medium", confidence: 0.7,
    summary: "Viral febrile illness. Manage with Paracetamol, hydration, and rest. Return if fever persists >3 days, rash appears, or breathing difficulty develops.",
    requiresImmediate: false,
  },
  headache: {
    possibleConditions: ["Tension headache", "Migraine", "Sinusitis"],
    recommendedActions: [
      "Ibuprofen (Brufen) — 400mg oral tablet — every 8 hrs with food — after meal — Max 1200mg/day — Adult dose — NSAID for headache pain",
      "Sumatriptan (Imigran) — 50mg oral tablet — at migraine onset, repeat after 2 hrs if needed — with or without food — Max 200mg/day — Adult dose — 5-HT1 agonist for migraine",
      "Domperidone (Motilium) — 10mg oral tablet — 30 min before Sumatriptan — before meals — Adult dose — Anti-emetic for nausea",
      "Rest in dark quiet room",
      "Cold compress on forehead",
    ],
    triageLevel: "low", confidence: 0.65,
    summary: "Headache — likely tension or migraine. Use Ibuprofen first. If migraine (aura, nausea, photophobia), use Sumatriptan. EMERGENCY if 'worst headache of life' — may be subarachnoid hemorrhage.",
    requiresImmediate: false,
  },
  stomach: {
    possibleConditions: ["Gastroenteritis", "Food poisoning", "Gastritis"],
    recommendedActions: [
      "ORS (Oral Rehydration Salt) — 1 sachet in 1L water — sip frequently — oral — Adult dose — Primary treatment for dehydration",
      "Ondansetron (Zofran) — 4mg sublingual tablet — every 8 hrs as needed — dissolve under tongue — Adult dose — Anti-emetic for vomiting",
      "Loperamide (Imodium) — 2mg capsule — 2 initially then 1 per loose stool — oral — Max 8/day — Adult dose — Anti-diarrheal (avoid if bloody stool)",
      "Omeprazole (Losec) — 20mg capsule — once before breakfast — empty stomach — Adult dose — Acid suppression for gastritis",
      "BRAT diet for 24-48 hours (Bananas, Rice, Applesauce, Toast)",
    ],
    triageLevel: "medium", confidence: 0.7,
    summary: "Gastroenteritis. Priority: ORS hydration. Control vomiting with Ondansetron. Avoid solid food first 12 hours. EMERGENCY if bloody stool or signs of severe dehydration.",
    requiresImmediate: false,
  },
  burns: {
    possibleConditions: ["Thermal burn", "Second-degree burn", "Burn infection risk"],
    recommendedActions: [
      "Silver Sulfadiazine (Silvadene) — 1% topical cream — thin layer 1-2x daily — cover with sterile gauze — external only — Adult dose — Antimicrobial burn wound treatment",
      "Ibuprofen (Brufen) — 400mg oral tablet — every 8 hrs with food — after meal — Adult dose — NSAID for burn pain",
      "Cefalexin (Keflex) — 500mg oral capsule — every 6 hrs for 7 days — with food — Adult dose — Antibiotic for burn infection prevention",
      "Cool burn under running water for 20 minutes — NOT ice",
      "Do NOT apply butter, toothpaste, or home remedies",
    ],
    triageLevel: "high", confidence: 0.75,
    summary: "Burn injury. Cool under running water 20 minutes IMMEDIATELY. Apply Silver Sulfadiazine. Emergency care required for burns larger than patient's palm.",
    requiresImmediate: true,
  },
  allergy: {
    possibleConditions: ["Allergic reaction", "Urticaria", "Anaphylaxis risk"],
    recommendedActions: [
      "Cetirizine (Zyrtec) — 10mg oral tablet — immediately then once daily — with or without food — Adult dose — Antihistamine for allergic reaction",
      "Prednisolone (Deltacortril) — 30mg oral tablet — once daily for 3-5 days — after breakfast — Adult dose — Corticosteroid for moderate-severe reaction",
      "Epinephrine (EpiPen) — 0.3mg IM auto-injector — outer thigh if anaphylaxis signs — through clothing if needed — repeat after 5 min — Adult dose — LIFE-SAVING for anaphylaxis",
      "Monitor for anaphylaxis: throat swelling, breathing difficulty, rapid pulse",
      "Remove allergen exposure if identified",
    ],
    triageLevel: "high", confidence: 0.75,
    summary: "Allergic reaction. Start Cetirizine. If ANY signs of anaphylaxis (throat swelling, breathing difficulty), inject Epinephrine IMMEDIATELY and call emergency. Can escalate rapidly.",
    requiresImmediate: true,
  },
  general: {
    possibleConditions: ["Undetermined condition", "Requires clinical evaluation"],
    recommendedActions: [
      "Paracetamol (Panadol) — 500mg oral tablet — 1-2 tablets every 6 hrs as needed — with or without food — Max 4g/day — Adult dose — General analgesic/antipyretic",
      "Ibuprofen (Brufen) — 400mg oral tablet — every 8 hrs if pain/inflammation — after food — Max 1200mg/day — Adult dose — NSAID for pain and inflammation",
      "ORS (Oral Rehydration Salt) — 1 sachet in 1L water — sip throughout day — oral — Adult dose — Maintain hydration",
      "Monitor symptoms closely",
      "Seek medical evaluation within 24 hours",
    ],
    triageLevel: "medium", confidence: 0.4,
    summary: "Symptoms require further evaluation. Basic management with Paracetamol and hydration. Monitor for deterioration. Professional medical assessment within 24 hours.",
    requiresImmediate: false,
  },
};

function matchFallback(text: string): AIAnalysis {
  const s = text.toLowerCase();
  if (s.match(/cut|wound|bleed|lacerat|stab|slash/)) return FALLBACKS.wound;
  if (s.match(/chest|heart|cardiac|palpitat/)) return FALLBACKS.cardiac;
  if (s.match(/breath|asthma|wheez|lung|chok/)) return FALLBACKS.breathing;
  if (s.match(/fracture|broken|bone|fall|sprain/)) return FALLBACKS.fracture;
  if (s.match(/fever|flu|cold|cough|temperat/)) return FALLBACKS.fever;
  if (s.match(/head|migrain|skull/)) return FALLBACKS.headache;
  if (s.match(/stomach|vomit|nausea|diarr|abdomen|belly/)) return FALLBACKS.stomach;
  if (s.match(/burn|scald|fire/)) return FALLBACKS.burns;
  if (s.match(/allergy|rash|hive|itch|swell|anaphyl/)) return FALLBACKS.allergy;
  return FALLBACKS.general;
}

function parseAIResponse(text: string): AIAnalysis {
  let jsonStr = text.trim();
  const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) jsonStr = match[1].trim();
  try {
    const p = JSON.parse(jsonStr);
    return {
      possibleConditions: p.possibleConditions || [],
      recommendedActions: p.recommendedActions || [],
      triageLevel: (["critical","high","medium","low"].includes(p.triageLevel) ? p.triageLevel : "medium") as Severity,
      confidence: Math.min(1, Math.max(0, p.confidence || 0.5)),
      summary: p.summary || "Analysis complete",
      requiresImmediate: p.requiresImmediate || false,
    };
  } catch {
    return { possibleConditions: [], recommendedActions: ["Seek professional evaluation"], triageLevel: "medium", confidence: 0.3, summary: text.slice(0, 200), requiresImmediate: false };
  }
}

async function analyzeWithGemini(symptoms: string, description: string, imageBase64?: string): Promise<AIAnalysis> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const textPart = { text: `${TRIAGE_PROMPT}\n\nPatient Symptoms: ${symptoms}\nDetails: ${description}` };
  const parts: any[] = [textPart];
  if (imageBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.3, maxOutputTokens: 2048 } }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini empty response");
  return parseAIResponse(text);
}

async function analyzeWithOpenAI(symptoms: string, description: string, imageBase64?: string): Promise<AIAnalysis> {
  const userContent: any = imageBase64
    ? [{ type: "text", text: `Symptoms: ${symptoms}\nDetails: ${description}` }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }]
    : `Symptoms: ${symptoms}\nDetails: ${description}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({ model: imageBase64 ? "gpt-4o" : "gpt-4o-mini", messages: [{ role: "system", content: TRIAGE_PROMPT }, { role: "user", content: userContent }], temperature: 0.3, max_tokens: 2048 }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI empty response");
  return parseAIResponse(text);
}

export async function analyzeSymptoms(symptoms: string, description: string, imageBase64?: string): Promise<AIAnalysis> {
  if (GEMINI_API_KEY && GEMINI_API_KEY !== "xxx") {
    try {
      console.log("🔵 Gemini analysis...");
      const r = await analyzeWithGemini(symptoms, description, imageBase64);
      console.log("✅ Gemini success");
      return r;
    } catch (e) { console.warn("⚠️ Gemini failed:", e); }
  }
  if (OPENAI_API_KEY && OPENAI_API_KEY !== "xxx") {
    try {
      console.log("🟡 OpenAI fallback...");
      const r = await analyzeWithOpenAI(symptoms, description, imageBase64);
      console.log("✅ OpenAI success");
      return r;
    } catch (e) { console.warn("⚠️ OpenAI failed:", e); }
  }
  console.warn("🟠 Using condition-specific fallback");
  return matchFallback(symptoms + " " + description);
}

export async function analyzeImage(imageBase64: string): Promise<string> {
  try {
    const r = await analyzeSymptoms("Visual assessment", "Patient submitted image for evaluation", imageBase64);
    return r.summary;
  } catch { return "Image analysis unavailable."; }
}
