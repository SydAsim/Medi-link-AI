"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Send,
  Phone,
  Globe,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LiveLocationStatus } from "./LiveLocationStatus";
import { ImageUploader } from "./ImageUploader";
import { createCase, uploadCaseImage } from "@/services/caseService";
import { analyzeSymptoms } from "@/services/aiService";
import type { Language, Severity } from "@/types";

interface PatientFormProps {
  onCaseSubmitted: (caseId: string) => void;
}

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "english", label: "English" },
  { value: "urdu", label: "اردو" },
  { value: "pashto", label: "پښتو" },
];

export function PatientForm({ onCaseSubmitted }: PatientFormProps) {
  // ─── State ───────────────────────────────────────────────
  const [phone, setPhone] = useState("");
  const [language, setLanguage] = useState<Language>("english");
  const [issueText, _setIssueText] = useState("");
  const issueTextRef = useRef("");
  const originalTextRef = useRef(""); // Buffer for mic input
  const setIssueText = (val: string) => {
    _setIssueText(val);
    issueTextRef.current = val;
  };

  // Location
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Voice
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ─── Load phone from localStorage ─────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("medilink_phone");
    if (saved) setPhone(saved);
  }, []);

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    localStorage.setItem("medilink_phone", val);
  };

  // ─── GPS Tracking ─────────────────────────────────────────
  const startGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported");
      setGpsLoading(false);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setAccuracy(pos.coords.accuracy);
        setGpsLoading(false);
        setGpsError(null);
      },
      (err) => {
        setGpsError(err.message);
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    startGPS();
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startGPS]);

  // ─── Voice Recognition ────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      const langMap: Record<Language, string> = {
        english: "en-US",
        urdu: "ur-PK",
        pashto: "ps-AF",
      };
      recognition.lang = langMap[language];

      recognition.onresult = (event: any) => {
        let sessionTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          sessionTranscript += event.results[i][0].transcript;
        }
        
        // Append current session transcript to whatever was in the box BEFORE we hit record
        const original = originalTextRef.current;
        if (original && !original.endsWith(" ")) {
          setIssueText(original + " " + sessionTranscript);
        } else {
          setIssueText((original || "") + sessionTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const startRecording = () => {
    if (!recognitionRef.current) return;
    try {
      originalTextRef.current = issueTextRef.current; // Snapshot text before recording
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (e) {
      console.warn("Recognition start failed:", e);
    }
  };

  const stopRecording = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setIsRecording(false);
    } catch (e) {
      console.warn("Recognition stop failed:", e);
    }
  };

  // ─── Image Handlers ───────────────────────────────────────
  const handleImageSelect = (file: File, preview: string) => {
    setImageFile(file);
    setImagePreview(preview);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // ─── Submit ────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError(null);

    // Validation
    if (!phone.trim()) {
      alert("Please enter your phone number.");
      return;
    }
    if (!issueTextRef.current.trim()) {
      alert("Please describe your emergency (voice or text).");
      return;
    }
    if (latitude === null || longitude === null) {
      alert("GPS location is required. Please enable location access.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload image if present
      let imageUrl: string | undefined;
      if (imageFile) {
        try {
          imageUrl = await uploadCaseImage(imageFile);
        } catch (err) {
          console.warn("Image upload failed, continuing without image:", err);
        }
      }

      // 2. Get AI analysis
      let aiResult;
      try {
        aiResult = await analyzeSymptoms(
          issueTextRef.current,
          `Language: ${language}. Patient phone: ${phone}.`
        );
      } catch (err) {
        console.warn("AI analysis failed:", err);
        aiResult = {
          triageLevel: "high" as Severity,
          summary: "AI analysis unavailable — manual review required.",
          recommendedActions: ["Seek immediate medical attention"],
          requiresImmediate: true,
          possibleConditions: [],
          confidence: 0,
        };
      }

      // 3. Create case in Firestore
      const caseId = await createCase({
        patientPhone: phone.trim(),
        language,
        issueText: issueTextRef.current.trim(),
        ...(imageUrl ? { imageUrl } : {}),
        latitude,
        longitude,
        accuracy: accuracy || 0,
        severity: aiResult.triageLevel,
        aiSummary: aiResult.summary,
        aiSuggestions: aiResult.recommendedActions,
        emergencyRequired: aiResult.requiresImmediate,
        status: "pending",
      });

      setSubmitted(true);
      onCaseSubmitted(caseId);

      // Reset form after brief delay
      setTimeout(() => {
        setIssueText("");
        setImageFile(null);
        setImagePreview(null);
        setSubmitted(false);
      }, 3000);
    } catch (err: any) {
      console.error("❌ Submit failed:", err);
      setSubmitError(err.message || "Failed to submit case. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Phone Number */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="relative">
          <Phone
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="Phone Number"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/30 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all"
            id="patient-phone"
          />
        </div>
      </motion.div>

      {/* Language Selector */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2"
      >
        {LANGUAGES.map((lang) => (
          <button
            key={lang.value}
            type="button"
            onClick={() => setLanguage(lang.value)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 active:scale-[0.97]",
              language === lang.value
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-slate-100 dark:bg-slate-800/30 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800/60 hover:text-slate-700 dark:text-slate-300"
            )}
          >
            {lang.value === language && <Globe size={14} />}
            {lang.label}
          </button>
        ))}
      </motion.div>

      {/* GPS Status */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <LiveLocationStatus
          latitude={latitude}
          longitude={longitude}
          accuracy={accuracy}
          loading={gpsLoading}
          error={gpsError}
          onRefresh={startGPS}
        />
      </motion.div>

      {/* Voice Record Button */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center py-4"
      >
        <motion.button
          type="button"
          onMouseDown={() => startRecording()}
          onMouseUp={() => stopRecording()}
          onMouseLeave={() => isRecording && stopRecording()}
          onTouchStart={() => startRecording()}
          onTouchEnd={() => stopRecording()}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "relative h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl",
            isRecording
              ? "bg-gradient-to-br from-red-500 to-red-700 shadow-red-500/40 emergency-pulse"
              : voiceSupported
              ? "bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 hover:border-red-500/40 hover:shadow-red-500/20"
              : "bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 opacity-50 cursor-not-allowed"
          )}
          disabled={!voiceSupported}
          id="voice-record-btn"
        >
          {isRecording ? (
            <Mic size={32} className="text-slate-900 dark:text-white" />
          ) : (
            <MicOff size={28} className="text-slate-600 dark:text-slate-400" />
          )}
          {/* Pulse rings when recording */}
          {isRecording && (
            <>
              <span className="absolute inset-0 rounded-full border-2 border-red-400/40 animate-ping" />
              <span className="absolute -inset-2 rounded-full border border-red-400/20 animate-pulse" />
            </>
          )}
        </motion.button>
        <p className="mt-3 text-xs text-slate-500 text-center">
          {isRecording ? (
            <span className="text-red-400 font-medium flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Listening... Release to stop
            </span>
          ) : voiceSupported ? (
            "PRESS AND HOLD TO SPEAK"
          ) : (
            "Voice input not supported in this browser"
          )}
        </p>
      </motion.div>

      {/* Image Upload */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <ImageUploader
          imageFile={imageFile}
          imagePreview={imagePreview}
          onImageSelect={handleImageSelect}
          onImageRemove={handleImageRemove}
          uploading={submitting}
        />
      </motion.div>

      {/* Text Area */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <textarea
          value={issueText}
          onChange={(e) => setIssueText(e.target.value)}
          placeholder={
            language === "urdu"
              ? "اپنی ایمرجنسی بیان کریں..."
              : language === "pashto"
              ? "خپل بیړنۍ حالت بیان کړئ..."
              : "Describe your emergency..."
          }
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/30 text-slate-900 dark:text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-all resize-none"
          dir={language === "urdu" || language === "pashto" ? "rtl" : "ltr"}
          id="patient-issue-text"
        />
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
          >
            <AlertTriangle size={16} />
            {submitError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2"
          >
            <CheckCircle size={16} />
            Emergency case submitted successfully! AI is analyzing...
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button — Always Enabled */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <button
          type="button"
          onClick={handleSubmit}
          className={cn(
            "w-full flex items-center justify-center gap-2.5 py-4 rounded-xl text-base font-bold transition-all duration-300 shadow-xl active:scale-[0.98]",
            submitting
              ? "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-wait"
              : "bg-gradient-to-r from-red-600 to-red-500 text-slate-900 dark:text-white hover:from-red-500 hover:to-red-400 shadow-red-500/30 hover:shadow-red-500/50"
          )}
          id="submit-emergency-btn"
        >
          {submitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Submitting & Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              🚀 REPORT EMERGENCY
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
