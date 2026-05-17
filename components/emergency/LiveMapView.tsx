"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapIcon, Truck } from "lucide-react";
import type { PatientCase } from "@/types";
import type { NearbyFacility } from "@/services/logisticsAgent";

interface LiveMapViewProps {
  caseData: PatientCase | null;
  ambulance?: NearbyFacility | null;
  hospital?: NearbyFacility | null;
  dispatched?: boolean;
}

export function LiveMapView({ caseData, ambulance, hospital, dispatched }: LiveMapViewProps) {
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [ambulancePos, setAmbulancePos] = useState<{ x: number; y: number } | null>(null);

  // Simulate ambulance movement from left edge → patient center
  useEffect(() => {
    if (!dispatched || !ambulance) {
      setAmbulancePos(null);
      return;
    }
    // Start off-screen left
    setAmbulancePos({ x: 5, y: 50 });

    let progress = 5;
    const interval = setInterval(() => {
      progress += 0.4; // move toward center (patient at ~50%)
      setAmbulancePos({ x: progress, y: 50 });
      if (progress >= 48) clearInterval(interval);
    }, 100);
    return () => clearInterval(interval);
  }, [dispatched, ambulance]);

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-100 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-800">
        <MapIcon size={32} className="text-slate-600 mb-3" />
        <p className="text-sm text-slate-500">Select a case to view location</p>
      </div>
    );
  }

  const { latitude, longitude } = caseData;
  const hasValidCoords =
    latitude !== undefined &&
    longitude !== undefined &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  if (!hasValidCoords) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-100 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-800 text-center p-6">
        <MapIcon size={32} className="text-red-900 mb-3" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Invalid GPS Coordinates</p>
        <p className="text-xs text-slate-600 mt-1">Cannot render map for this location.</p>
      </div>
    );
  }

  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${latitude},${longitude}&zoom=15`;

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group">
      {API_KEY && API_KEY !== "xxx" ? (
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{
            border: 0,
            filter: "invert(90%) hue-rotate(180deg) brightness(80%) contrast(120%)",
          }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 z-0"
        />
      ) : (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50">
          <MapIcon size={48} className="text-slate-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Google Maps Integration</p>
          <p className="text-xs text-slate-500 mt-1">
            Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </p>
        </div>
      )}

      {/* Overlay info */}
      <div className="absolute top-3 left-3 z-10 bg-white dark:bg-slate-900/80 backdrop-blur-sm border border-slate-300 dark:border-slate-700 p-2 rounded-lg pointer-events-none">
        <p className="text-[10px] font-mono text-emerald-400">LAT: {latitude.toFixed(6)}</p>
        <p className="text-[10px] font-mono text-blue-400">LNG: {longitude.toFixed(6)}</p>
      </div>

      {/* Hospital info overlay */}
      {hospital && (
        <div className="absolute top-3 right-3 z-10 bg-white dark:bg-slate-900/90 backdrop-blur-sm border border-blue-500/30 p-2 rounded-lg max-w-[160px]">
          <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">🏥 Nearest Hospital</p>
          <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-tight">{hospital.name}</p>
          <p className="text-[9px] text-slate-500">ETA: {hospital.duration}</p>
        </div>
      )}

      {/* Target Crosshair (patient) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-red-500/50 -translate-x-1/2" />
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-red-500/50 -translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-red-500 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping" />
        </div>
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
          PATIENT
        </div>
      </div>

      {/* Animated Ambulance */}
      {dispatched && ambulancePos && (
        <div
          className="absolute z-20 pointer-events-none transition-all duration-100"
          style={{
            left: `${ambulancePos.x}%`,
            top: `${ambulancePos.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative flex flex-col items-center">
            {/* Pulsing ring */}
            <div className="absolute w-8 h-8 rounded-full bg-amber-500/20 animate-ping" />
            {/* Ambulance icon */}
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shadow-lg border-2 border-white relative z-10">
              <Truck size={14} className="text-white" />
            </div>
            <div className="mt-1 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded whitespace-nowrap shadow">
              AMBULANCE
            </div>
          </div>
        </div>
      )}

      {/* Dispatch status banner */}
      {dispatched && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
          <Truck size={10} className="animate-bounce" />
          AMBULANCE EN ROUTE — {ambulance?.duration || "~5 mins"}
        </div>
      )}
    </div>
  );
}
