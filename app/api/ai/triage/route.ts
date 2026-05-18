// ============================================
// MediLink AI Triage Agent
// Gemini 2.0 Flash Primary + OpenAI Fallback
// Multilingual Urdu / Roman Urdu / Pashto / English
// Image analysis + emergency triage + doctor-review medicines
// ============================================

import { NextRequest, NextResponse } from "next/server";

type Severity = "critical" | "high" | "medium" | "low";

export type AIAnalysis = {
  detectedLanguage: string;
  normalizedInputEnglish: string;
  possibleConditions: string[];
  recommendedFirstAid: string[];
  doctorReviewMedicines: string[];
  situationalSuggestions: string[];
  redFlags: string[];
  safetyWarnings: string[];
  triageLevel: Severity;
  confidence: number;
  patientMessage: string;
  doctorSummary: string;
  summary: string;
  requiresImmediate: boolean;
};

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

const TRIAGE_PROMPT = `
You are MediLink AI Triage Agent.

Your job is emergency triage, multilingual symptom understanding, injury image analysis, and safe first-response guidance.

You are NOT a doctor. You do not provide a final diagnosis. You do not prescribe medicines directly to patients.
Medicine suggestions are ONLY for doctor review and must be clearly marked as "doctorReviewMedicines".

========================
LANGUAGE UNDERSTANDING
========================
Users may write in:
- English
- Urdu script
- Roman Urdu
- Pashto script
- Roman Pashto
- Mixed Urdu + English

You must understand natural, messy, non-medical language.

Examples:
- "mere hath se khoon nikal raha hai" = bleeding from my hand
- "mera sar bohat dard kar raha hai" = severe headache
- "saans nahi aa rahi" = difficulty breathing
- "seeny me dard hai" = chest pain
- "zakhm ho gaya hai" = wound/cut
- "چوٹ لگ گئی ہے" = injury
- "خون بہہ رہا ہے" = bleeding
- "ساه نه راځي" = difficulty breathing
- "زما سر ډیر درد کوي" = my head hurts badly

Always detect the user's language and respond in the same language style:
- Roman Urdu input => Roman Urdu response
- Urdu script input => Urdu script response
- Pashto input => Pashto response
- English input => English response
- Mixed input => simple mixed response

========================
NORMALIZATION STEP
========================
Before triage, silently normalize the user input into clinical English.
Use this normalized meaning to classify severity.
Do NOT require exact medical words.
Infer meaning from common local phrases.

========================
IMAGE ANALYSIS
========================
If an image is provided, analyze visible signs only:
- bleeding
- wound depth
- swelling
- burn
- deformity
- rash
- skin color changes
- possible infection signs
- visible danger signs

Never claim certainty from image alone.
Use phrases like:
- "visible signs suggest..."
- "the image appears to show..."
- "this may need medical review..."

========================
SEVERITY RULES
========================
CRITICAL if:
- chest pain with sweating, breathlessness, fainting
- severe breathing difficulty
- unconsciousness, seizure, stroke signs
- heavy uncontrolled bleeding
- deep wound with active bleeding
- severe burn, face/neck burn, large burn
- major accident
- head injury with vomiting/confusion
- poisoning
- severe allergic reaction or throat swelling

HIGH if:
- deep cut but bleeding controlled
- suspected fracture/deformity
- high fever with weakness/confusion
- moderate breathing problem
- infected wound signs
- severe pain after trauma

MEDIUM if:
- fever/cough without red flags
- vomiting/diarrhea but awake and drinking
- moderate headache without red flags
- minor burn
- mild allergic rash without breathing issue

LOW if:
- minor discomfort
- mild headache
- small scratch
- non-medical/joke/test

========================
PATIENT SAFETY
========================
For patient-facing advice:
- Give immediate first-aid steps.
- Keep language calm and human.
- Tell when to call emergency services.
- Do NOT tell patient to start antibiotics, injections, opioids, heart medicines, or prescription-only drugs.
- For simple OTC medicine, only mention general safe options when appropriate, such as paracetamol for fever/pain, with a safety warning to follow label/local doctor advice.
- Always warn about allergies, pregnancy, children, elderly, chronic illness, blood thinners, kidney/liver disease when relevant.

========================
DOCTOR MEDICINE REVIEW
========================
doctorReviewMedicines may include possible medicines for clinician review only.
Every item must start with:
"FOR DOCTOR REVIEW ONLY —"

Do not present these as instructions for the patient.
Avoid aggressive emergency drug instructions unless the case is clearly critical, and still mark for doctor/EMS review.

Medicine format:
FOR DOCTOR REVIEW ONLY — Chemical Name (Brand Name) — strength/form if relevant — route — purpose — key caution

========================
JOKE / TEST / UNCLEAR
========================
If joke/test/non-medical:
- triageLevel low
- confidence high
- no medicines
- friendly response

If unclear:
- ask 2-4 short questions
- give safe general advice
- triageLevel low or medium depending on risk

========================
OUTPUT
========================
Respond ONLY with valid JSON.

Schema:
{
  "detectedLanguage": "english|urdu|roman_urdu|pashto|roman_pashto|mixed|unknown",
  "normalizedInputEnglish": "short English meaning of the user's input",
  "possibleConditions": ["not final diagnoses"],
  "recommendedFirstAid": ["safe immediate steps for the patient"],
  "doctorReviewMedicines": ["FOR DOCTOR REVIEW ONLY — ..."],
  "situationalSuggestions": ["practical next steps"],
  "redFlags": ["danger signs to watch for"],
  "safetyWarnings": ["allergy/chronic disease/pregnancy/child warnings"],
  "triageLevel": "critical|high|medium|low",
  "confidence": 0.0,
  "patientMessage": "warm patient-facing response in the user's same language",
  "doctorSummary": "concise clinical-style summary in English for dashboard",
  "summary": "same as patientMessage or concise case summary",
  "requiresImmediate": true
}

Patient history:
- Check allergies, chronic disease, previous medicines, age, pregnancy status if provided.
- If no history is available, include: "Medical history/allergies unknown — verify before medication."
`;

function normalizeLocalMedicalText(text: string): string {
  const s = String(text || "").toLowerCase();

  const patterns: Record<string, string[]> = {
    wound: [
      "cut",
      "wound",
      "bleed",
      "bleeding",
      "blood",
      "injury",
      "laceration",
      "stab",
      "slash",
      "zakhm",
      "zakham",
      "zakhmi",
      "khoon",
      "khoon nikal",
      "khoon beh",
      "chot",
      "چوٹ",
      "زخم",
      "خون",
      "کٹ",
      "خون بہ",
      "خون نکل",
      "ټپ",
      "وینه",
      "زخم",
      "ژوبل",
    ],
    cardiac: [
      "chest pain",
      "heart pain",
      "cardiac",
      "palpitation",
      "seeny me dard",
      "seene me dard",
      "sina dard",
      "dil dard",
      "دل",
      "سینہ",
      "سینے میں درد",
      "چھاتی",
      "زړه",
      "سينه",
    ],
    breathing: [
      "breath",
      "breathing",
      "asthma",
      "wheezing",
      "choking",
      "lung",
      "saans",
      "sans",
      "saans nahi",
      "saans phool",
      "dam ghut",
      "سانس",
      "ساه",
      "دم",
      "ساه نه",
      "ساه بند",
    ],
    fracture: [
      "fracture",
      "broken",
      "bone",
      "fall",
      "sprain",
      "deformity",
      "haddi",
      "hadi toot",
      "gir gaya",
      "gir gai",
      "ہڈی",
      "ٹوٹی",
      "گر گیا",
      "مات",
      "هډوکی",
    ],
    fever: [
      "fever",
      "temperature",
      "flu",
      "cough",
      "cold",
      "bukhar",
      "zukam",
      "khansi",
      "tap",
      "بخار",
      "نزلہ",
      "زکام",
      "کھانسی",
      "تبه",
      "ټوخی",
    ],
    headache: [
      "headache",
      "migraine",
      "head pain",
      "sar dard",
      "sir dard",
      "sar phat",
      "sar bohat dard",
      "سر درد",
      "سر",
      "درد سر",
      "سر خوږ",
      "سر درد کوي",
    ],
    stomach: [
      "stomach",
      "vomit",
      "nausea",
      "diarrhea",
      "belly",
      "abdomen",
      "pait",
      "pet",
      "ulti",
      "qay",
      "dast",
      "motion",
      "پیٹ",
      "قے",
      "الٹی",
      "دست",
      "معدہ",
      "کانګې",
      "نس ناستی",
    ],
    burns: [
      "burn",
      "fire",
      "scald",
      "burning",
      "jal gaya",
      "jal gai",
      "aag",
      "garam pani",
      "جل گیا",
      "آگ",
      "سوزش",
      "سوځېدلی",
      "اور",
    ],
    allergy: [
      "allergy",
      "rash",
      "itch",
      "swelling",
      "hives",
      "anaphylaxis",
      "khujli",
      "soojan",
      "sujan",
      "phora",
      "dana",
      "الرجی",
      "خارش",
      "سوجن",
      "دانہ",
      "پړسوب",
      "خارښت",
    ],
    stroke: [
      "stroke",
      "face droop",
      "weakness one side",
      "bol nahi",
      "zuban larkhara",
      "فالج",
      "کمزوری",
      "زبان",
      "خبرې نه شي",
    ],
    seizure: [
      "seizure",
      "fit",
      "fits",
      "convulsion",
      "jhatkay",
      "daura",
      "دورہ",
      "جھٹکے",
      "مرگی",
      "حمله",
    ],
  };

  const matched: string[] = [];

  for (const [label, words] of Object.entries(patterns)) {
    if (words.some((w) => s.includes(w))) {
      matched.push(label);
    }
  }

  return `${text || ""}

[normalized_keywords]: ${matched.join(", ") || "none"}`;
}

const FALLBACKS: Record<string, AIAnalysis> = {
  wound: {
    detectedLanguage: "unknown",
    normalizedInputEnglish: "Possible wound or bleeding injury",
    possibleConditions: ["Possible wound/laceration", "Bleeding risk", "Infection risk"],
    recommendedFirstAid: [
      "Apply firm direct pressure with a clean cloth or sterile gauze.",
      "If possible, raise the injured area above heart level.",
      "Rinse minor dirt with clean running water. Do not scrub a deep wound.",
      "Cover with a clean dressing.",
      "Seek urgent medical care if bleeding does not stop, wound is deep, or edges are wide open.",
    ],
    doctorReviewMedicines: [
      "FOR DOCTOR REVIEW ONLY — Tetanus toxoid — vaccine/booster if indicated — IM — tetanus prevention — verify vaccination history.",
      "FOR DOCTOR REVIEW ONLY — Amoxicillin + Clavulanic Acid (Augmentin) — oral antibiotic — oral — infection prevention/treatment if clinically indicated — check allergy history.",
      "FOR DOCTOR REVIEW ONLY — Paracetamol (Panadol) — analgesic/antipyretic — oral — pain control — check liver disease and dose limits.",
    ],
    situationalSuggestions: [
      "Do not apply powders, toothpaste, or unclean home remedies.",
      "Do not remove deeply stuck objects; stabilize them and seek emergency care.",
    ],
    redFlags: [
      "Bleeding does not stop after firm pressure.",
      "Deep wound, exposed fat/muscle/bone, numbness, or loss of movement.",
      "Animal bite, dirty/rusty object, or signs of infection.",
    ],
    safetyWarnings: ["Medical history/allergies unknown — verify before medication."],
    triageLevel: "high",
    confidence: 0.75,
    patientMessage:
      "It looks like a wound or bleeding injury. Stay calm. Apply firm pressure with a clean cloth and keep the injured part raised if possible. If bleeding is heavy or does not stop, get emergency help immediately.",
    doctorSummary:
      "Possible wound/laceration with bleeding risk. Assess wound depth, neurovascular status, contamination, tetanus status, and need for closure/antibiotics.",
    summary:
      "Possible wound or bleeding injury requiring pressure, dressing, and medical review if deep or uncontrolled.",
    requiresImmediate: true,
  },

  cardiac: {
    detectedLanguage: "unknown",
    normalizedInputEnglish: "Possible chest pain or cardiac emergency",
    possibleConditions: ["Possible acute coronary syndrome", "Chest pain requiring urgent evaluation"],
    recommendedFirstAid: [
      "Call emergency services immediately.",
      "Keep the patient sitting upright and resting.",
      "Loosen tight clothing.",
      "Do not let the patient walk or drive themselves.",
      "If unconscious and not breathing normally, start CPR if trained.",
    ],
    doctorReviewMedicines: [
      "FOR DOCTOR REVIEW ONLY — Aspirin — antiplatelet — oral/chewable — suspected ACS support — avoid if allergy, active bleeding, or contraindication.",
      "FOR DOCTOR REVIEW ONLY — Nitroglycerin — vasodilator — sublingual — chest pain relief when indicated — avoid with low BP or recent PDE5 inhibitor use.",
    ],
    situationalSuggestions: [
      "Ask about sweating, shortness of breath, left arm/jaw pain, fainting, or previous heart disease.",
    ],
    redFlags: [
      "Chest pain with sweating, breathlessness, fainting, nausea, or pain spreading to arm/jaw.",
    ],
    safetyWarnings: ["This may be life-threatening. Emergency medical evaluation is required."],
    triageLevel: "critical",
    confidence: 0.85,
    patientMessage:
      "This could be serious. Please call emergency services now. Sit upright, stay still, and do not drive yourself.",
    doctorSummary:
      "Possible ACS/cardiac chest pain. Requires urgent ECG, vitals, oxygen assessment, and emergency protocol evaluation.",
    summary: "Possible cardiac emergency. Immediate emergency care required.",
    requiresImmediate: true,
  },

  breathing: {
    detectedLanguage: "unknown",
    normalizedInputEnglish: "Possible breathing difficulty",
    possibleConditions: ["Respiratory distress", "Asthma/bronchospasm possible", "Airway risk"],
    recommendedFirstAid: [
      "Sit upright and lean slightly forward.",
      "Keep the patient calm and avoid lying flat.",
      "Use prescribed inhaler if the patient already has one.",
      "Call emergency services if breathing is severe, lips turn blue, or speech is difficult.",
    ],
    doctorReviewMedicines: [
      "FOR DOCTOR REVIEW ONLY — Salbutamol (Ventolin) — inhaler/nebulizer — inhaled — bronchodilation — monitor response and oxygen saturation.",
      "FOR DOCTOR REVIEW ONLY — Ipratropium Bromide — inhaled — bronchodilation adjunct — clinician-directed use.",
      "FOR DOCTOR REVIEW ONLY — Prednisolone — corticosteroid — oral — airway inflammation — verify indication and contraindications.",
    ],
    situationalSuggestions: [
      "Check if patient has asthma, allergy, choking, chest pain, or fever.",
    ],
    redFlags: [
      "Unable to speak full sentences.",
      "Blue lips/face.",
      "Severe wheezing or silent chest.",
      "Confusion or fainting.",
    ],
    safetyWarnings: ["Severe breathing difficulty is an emergency."],
    triageLevel: "high",
    confidence: 0.8,
    patientMessage:
      "Breathing difficulty can become serious. Sit upright, stay calm, and use your prescribed inhaler if you have one. If breathing is severe or lips look blue, call emergency services now.",
    doctorSummary:
      "Respiratory distress/bronchospasm possible. Assess SpO2, airway, chest findings, triggers, and need for urgent bronchodilator/oxygen support.",
    summary: "Possible breathing difficulty requiring urgent assessment if severe.",
    requiresImmediate: true,
  },

  fever: {
    detectedLanguage: "unknown",
    normalizedInputEnglish: "Possible fever or infection symptoms",
    possibleConditions: ["Fever", "Viral illness", "Infection possible"],
    recommendedFirstAid: [
      "Rest and drink fluids.",
      "Use light clothing and avoid overheating.",
      "Paracetamol may be used for fever/pain if safe for the patient and according to the label.",
      "Seek medical care if fever is very high, persistent, or with red flags.",
    ],
    doctorReviewMedicines: [
      "FOR DOCTOR REVIEW ONLY — Paracetamol (Panadol) — oral tablet/syrup — oral — fever/pain control — check liver disease and total daily dose.",
    ],
    situationalSuggestions: [
      "Check temperature if possible.",
      "Look for rash, breathing difficulty, neck stiffness, confusion, dehydration, or persistent vomiting.",
    ],
    redFlags: [
      "Confusion, stiff neck, breathing difficulty, rash, dehydration, fever above 39.5°C, or fever lasting more than 3 days.",
    ],
    safetyWarnings: ["Medical history/allergies unknown — verify before medication."],
    triageLevel: "medium",
    confidence: 0.7,
    patientMessage:
      "This sounds like fever or infection symptoms. Rest, drink fluids, and monitor temperature. If there is confusion, breathing difficulty, rash, stiff neck, or very high fever, seek urgent care.",
    doctorSummary:
      "Fever syndrome. Assess duration, temperature, hydration, respiratory/GI/urinary symptoms, rash, and red flags.",
    summary: "Possible fever/infection symptoms. Monitor and escalate if red flags appear.",
    requiresImmediate: false,
  },

  headache: {
    detectedLanguage: "unknown",
    normalizedInputEnglish: "Possible headache",
    possibleConditions: ["Tension headache", "Migraine possible", "Secondary headache needs exclusion"],
    recommendedFirstAid: [
      "Rest in a quiet, dim room.",
      "Drink water.",
      "Use a cold compress on the forehead.",
      "Paracetamol may be used if safe and according to the label.",
      "Seek emergency care if it is the worst headache of life or with neurological symptoms.",
    ],
    doctorReviewMedicines: [
      "FOR DOCTOR REVIEW ONLY — Paracetamol (Panadol) — oral analgesic — oral — headache pain — check liver disease and dose limits.",
      "FOR DOCTOR REVIEW ONLY — Ibuprofen (Brufen) — NSAID — oral — pain/inflammation — avoid in stomach ulcer, kidney disease, blood thinners, pregnancy unless clinician-approved.",
    ],
    situationalSuggestions: [
      "Ask about vomiting, fever, neck stiffness, weakness, vision changes, head injury, and sudden onset.",
    ],
    redFlags: [
      "Worst headache of life.",
      "Sudden thunderclap headache.",
      "Weakness, confusion, seizure, fainting, fever with stiff neck, or head injury.",
    ],
    safetyWarnings: ["Medical history/allergies unknown — verify before medication."],
    triageLevel: "low",
    confidence: 0.65,
    patientMessage:
      "This sounds like a headache. Rest in a quiet place, drink water, and use a cold compress. If it is sudden and severe, or comes with weakness, confusion, vomiting, fever, or vision changes, seek emergency care.",
    doctorSummary:
      "Headache complaint. Rule out red flags: thunderclap onset, neuro deficit, meningism, trauma, fever, altered mental status.",
    summary: "Possible headache. Red flags require urgent evaluation.",
    requiresImmediate: false,
  },

  general: {
    detectedLanguage: "unknown",
    normalizedInputEnglish: "Unclear or insufficient symptoms",
    possibleConditions: ["Unclear symptoms"],
    recommendedFirstAid: [
      "Please provide more detail about what happened, where the pain/injury is, and when it started.",
      "If the person is unconscious, not breathing, bleeding heavily, or has chest pain, call emergency services immediately.",
    ],
    doctorReviewMedicines: [],
    situationalSuggestions: [
      "Share age, symptoms, duration, pain level, allergies, and any existing illness.",
    ],
    redFlags: [
      "Unconsciousness, severe breathing difficulty, chest pain, heavy bleeding, seizure, severe allergic reaction.",
    ],
    safetyWarnings: ["Medical history/allergies unknown — verify before medication."],
    triageLevel: "low",
    confidence: 0.25,
    patientMessage:
      "I need a little more detail to help safely. Please tell me what happened, where the problem is, when it started, and how severe it feels. If there is heavy bleeding, chest pain, breathing difficulty, or unconsciousness, call emergency services now.",
    doctorSummary: "Insufficient information for triage. Request more details and screen for red flags.",
    summary: "Unclear symptoms. More information needed.",
    requiresImmediate: false,
  },

  test: {
    detectedLanguage: "unknown",
    normalizedInputEnglish: "Test or non-medical message",
    possibleConditions: ["No medical emergency detected"],
    recommendedFirstAid: ["No medical action needed."],
    doctorReviewMedicines: [],
    situationalSuggestions: ["Send symptoms, injury details, or an image if you need help."],
    redFlags: [],
    safetyWarnings: [],
    triageLevel: "low",
    confidence: 1,
    patientMessage:
      "Everything seems okay. This looks like a test or non-medical message. I am ready to help if you share symptoms or an emergency situation.",
    doctorSummary: "Test/non-medical input.",
    summary: "No medical emergency detected.",
    requiresImmediate: false,
  },
};

function matchFallback(text: string): AIAnalysis {
  const s = normalizeLocalMedicalText(text).toLowerCase();

  if (
    /joke|kidding|test|testing|bored|checking|dummy|hello|hi|salam|سلام/.test(s)
  ) {
    return FALLBACKS.test;
  }

  if (/wound|bleed|blood|injury|zakhm|zakham|khoon|chot|زخم|خون|چوٹ|ټپ|وینه/.test(s)) {
    return FALLBACKS.wound;
  }

  if (/cardiac|chest|heart|seeny|seene|sina|dil|دل|سینہ|سينه|زړه/.test(s)) {
    return FALLBACKS.cardiac;
  }

  if (/breath|breathing|asthma|wheez|chok|saans|sans|sah|dam|سانس|ساه|دم/.test(s)) {
    return FALLBACKS.breathing;
  }

  if (/fever|temperature|flu|cough|cold|bukhar|zukam|khansi|بخار|زکام|کھانسی|تبه|ټوخی/.test(s)) {
    return FALLBACKS.fever;
  }

  if (/headache|head pain|migraine|sar|sir|سر|خوږ|درد/.test(s)) {
    return FALLBACKS.headache;
  }

  return FALLBACKS.general;
}

function parseAIResponse(text: string): AIAnalysis {
  let jsonStr = String(text || "").trim();

  const blockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (blockMatch) {
    jsonStr = blockMatch[1].trim();
  } else {
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }
  }

  try {
    const p = JSON.parse(jsonStr);

    const rawTriage = String(p.triageLevel || "").toLowerCase().trim();
    const finalTriage: Severity = ["critical", "high", "medium", "low"].includes(
      rawTriage
    )
      ? (rawTriage as Severity)
      : "medium";

    const requiresImmediate =
      p.requiresImmediate === true ||
      String(p.requiresImmediate).toLowerCase() === "true" ||
      finalTriage === "critical";

    const patientMessage =
      typeof p.patientMessage === "string"
        ? p.patientMessage
        : typeof p.summary === "string"
          ? p.summary
          : "Analysis complete.";

    const doctorSummary =
      typeof p.doctorSummary === "string"
        ? p.doctorSummary
        : typeof p.normalizedInputEnglish === "string"
          ? p.normalizedInputEnglish
          : "Clinical summary unavailable.";

    return {
      detectedLanguage: String(p.detectedLanguage || "unknown"),
      normalizedInputEnglish: String(p.normalizedInputEnglish || ""),
      possibleConditions: Array.isArray(p.possibleConditions)
        ? p.possibleConditions.map(String)
        : [],
      recommendedFirstAid: Array.isArray(p.recommendedFirstAid)
        ? p.recommendedFirstAid.map(String)
        : [],
      doctorReviewMedicines: Array.isArray(p.doctorReviewMedicines)
        ? p.doctorReviewMedicines.map(String)
        : [],
      situationalSuggestions: Array.isArray(p.situationalSuggestions)
        ? p.situationalSuggestions.map(String)
        : [],
      redFlags: Array.isArray(p.redFlags) ? p.redFlags.map(String) : [],
      safetyWarnings: Array.isArray(p.safetyWarnings)
        ? p.safetyWarnings.map(String)
        : [],
      triageLevel: finalTriage,
      confidence: Math.min(1, Math.max(0, Number(p.confidence) || 0.5)),
      patientMessage,
      doctorSummary,
      summary: String(p.summary || patientMessage),
      requiresImmediate,
    };
  } catch (err) {
    console.warn("Failed to parse AI JSON:", err, "Raw text:", text);

    const isCritical = /"triageLevel"\s*:\s*"critical"/i.test(text);
    const isHigh = /"triageLevel"\s*:\s*"high"/i.test(text);
    const fallbackTriage: Severity = isCritical ? "critical" : isHigh ? "high" : "medium";

    return {
      detectedLanguage: "unknown",
      normalizedInputEnglish: "",
      possibleConditions: [],
      recommendedFirstAid: ["Seek professional medical evaluation."],
      doctorReviewMedicines: [],
      situationalSuggestions: [],
      redFlags: [],
      safetyWarnings: ["AI response could not be parsed safely."],
      triageLevel: fallbackTriage,
      confidence: 0.3,
      patientMessage: String(text || "Analysis unavailable.").slice(0, 300),
      doctorSummary: String(text || "Analysis unavailable.").slice(0, 300),
      summary: String(text || "Analysis unavailable.").slice(0, 300),
      requiresImmediate: fallbackTriage === "critical",
    };
  }
}

function stripDataUrl(base64?: string): string | undefined {
  if (!base64) return undefined;

  if (base64.startsWith("data:image")) {
    const parts = base64.split(",");
    return parts[1] || undefined;
  }

  return base64;
}

async function analyzeWithGemini(params: {
  symptoms: string;
  description: string;
  patientHistory?: string;
  imageBase64?: string;
}): Promise<AIAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const { symptoms, description, patientHistory, imageBase64 } = params;

  const normalizedSymptoms = normalizeLocalMedicalText(symptoms);
  const normalizedDescription = normalizeLocalMedicalText(description);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const textPart = {
    text: `${TRIAGE_PROMPT}

[PATIENT HISTORY]:
${patientHistory || "No historical records provided."}

[CURRENT CASE RAW]:
Symptoms: ${symptoms || ""}
Details: ${description || ""}

[CURRENT CASE NORMALIZED HINTS]:
Symptoms:
${normalizedSymptoms}

Details:
${normalizedDescription}
`,
  };

  const parts: any[] = [textPart];

  const cleanImage = stripDataUrl(imageBase64);
  if (cleanImage) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanImage,
      },
    });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini empty response");
  }

  return parseAIResponse(text);
}

async function analyzeWithOpenAI(params: {
  symptoms: string;
  description: string;
  patientHistory?: string;
  imageBase64?: string;
}): Promise<AIAnalysis> {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const { symptoms, description, patientHistory, imageBase64 } = params;

  const normalizedSymptoms = normalizeLocalMedicalText(symptoms);
  const normalizedDescription = normalizeLocalMedicalText(description);

  const cleanImage = stripDataUrl(imageBase64);

  const caseText = `
[PATIENT HISTORY]:
${patientHistory || "No historical records provided."}

[CURRENT CASE RAW]:
Symptoms: ${symptoms || ""}
Details: ${description || ""}

[CURRENT CASE NORMALIZED HINTS]:
Symptoms:
${normalizedSymptoms}

Details:
${normalizedDescription}
`;

  const userContent: any = cleanImage
    ? [
        {
          type: "text",
          text: caseText,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${cleanImage}`,
          },
        },
      ]
    : caseText;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: cleanImage ? "gpt-4o" : "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: TRIAGE_PROMPT,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: 0.2,
      max_tokens: 2048,
      response_format: {
        type: "json_object",
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("OpenAI empty response");
  }

  return parseAIResponse(text);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const symptoms = String(body.symptoms || "");
    const description = String(body.description || "");
    const patientHistory = body.patientHistory
      ? String(body.patientHistory)
      : undefined;
    const imageBase64 = body.imageBase64 ? String(body.imageBase64) : undefined;

    const combinedText = `${symptoms} ${description}`.trim();

    if (!combinedText && !imageBase64) {
      return NextResponse.json(
        {
          error: "Missing symptoms, description, or imageBase64.",
        },
        { status: 400 }
      );
    }

    if (GEMINI_API_KEY) {
      try {
        const result = await analyzeWithGemini({
          symptoms,
          description,
          patientHistory,
          imageBase64,
        });

        return NextResponse.json({
          ok: true,
          provider: "gemini",
          analysis: result,
        });
      } catch (error) {
        console.error("Gemini triage failed:", error);
      }
    }

    if (OPENAI_API_KEY) {
      try {
        const result = await analyzeWithOpenAI({
          symptoms,
          description,
          patientHistory,
          imageBase64,
        });

        return NextResponse.json({
          ok: true,
          provider: "openai",
          analysis: result,
        });
      } catch (error) {
        console.error("OpenAI triage failed:", error);
      }
    }

    const fallback = matchFallback(combinedText || "visual assessment");

    return NextResponse.json({
      ok: true,
      provider: "fallback",
      analysis: fallback,
    });
  } catch (error) {
    console.error("Triage route error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: "Triage analysis failed.",
      },
      { status: 500 }
    );
  }
}
