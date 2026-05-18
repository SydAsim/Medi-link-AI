"use client";

import type { AIAnalysis, Severity } from "@/types";

export async function analyzeSymptoms(
  symptoms: string,
  description: string,
  patientHistory?: string,
  imageBase64?: string
): Promise<AIAnalysis> {
  const res = await fetch("/api/ai/triage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      symptoms,
      description,
      patientHistory,
      imageBase64,
    }),
  });

  if (!res.ok) {
    throw new Error(`Triage API failed: ${res.status}`);
  }

  const data = await res.json();

  if (!data.ok || !data.analysis) {
    throw new Error(data.error || "Triage analysis failed.");
  }

  const rawAnalysis = data.analysis;

  // Flawless backwards compatibility mapping for existing UI components:
  const analysis: AIAnalysis = {
    detectedLanguage: rawAnalysis.detectedLanguage || "unknown",
    normalizedInputEnglish: rawAnalysis.normalizedInputEnglish || "",
    possibleConditions: rawAnalysis.possibleConditions || [],
    recommendedFirstAid: rawAnalysis.recommendedFirstAid || [],
    doctorReviewMedicines: rawAnalysis.doctorReviewMedicines || [],
    // recommendedActions combines medications and first aid so existing doctor/dispatcher dashboards display properly
    recommendedActions: [
      ...(rawAnalysis.doctorReviewMedicines || []),
      ...(rawAnalysis.recommendedFirstAid || [])
    ],
    situationalSuggestions: rawAnalysis.recommendedFirstAid || [],
    redFlags: rawAnalysis.redFlags || [],
    safetyWarnings: rawAnalysis.safetyWarnings || [],
    triageLevel: rawAnalysis.triageLevel as Severity,
    confidence: Number(rawAnalysis.confidence) || 0.5,
    patientMessage: rawAnalysis.patientMessage || rawAnalysis.summary || "",
    doctorSummary: rawAnalysis.doctorSummary || rawAnalysis.normalizedInputEnglish || "",
    summary: rawAnalysis.summary || rawAnalysis.patientMessage || "",
    requiresImmediate: !!rawAnalysis.requiresImmediate,
  };

  return analysis;
}

export async function analyzeImage(imageBase64: string): Promise<string> {
  const result = await analyzeSymptoms(
    "Visual assessment",
    "Patient submitted an image for emergency triage. Analyze visible signs only.",
    undefined,
    imageBase64
  );

  return result.patientMessage || result.summary || result.doctorSummary || "Image analyzed.";
}
