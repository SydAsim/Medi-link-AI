"use client";

import { useEffect, useRef } from "react";
import { Map as MapIcon, Loader2 } from "lucide-react";
import type { PatientCase } from "@/types";

interface LiveMapViewProps {
  caseData: PatientCase | null;
}

export function LiveMapView({ caseData }: LiveMapViewProps) {
  // In a real app, this would use google-maps-react or similar
  // For the hackathon MVP, we use an iframe or a styled placeholder if no key
  
  const mapRef = useRef<HTMLDivElement>(null);
  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!caseData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-100 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-800">
        <MapIcon size={32} className="text-slate-600 mb-3" />
        <p className="text-sm text-slate-500">Select a case to view location</p>
      </div>
    );
  }

  const { latitude, longitude } = caseData;
  const hasValidCoords = latitude !== undefined && longitude !== undefined && !isNaN(latitude) && !isNaN(longitude);

  if (!hasValidCoords) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] bg-slate-100 dark:bg-slate-800/20 rounded-xl border border-slate-200 dark:border-slate-800 text-center p-6">
        <MapIcon size={32} className="text-red-900 mb-3" />
        <p className="text-sm text-slate-600 dark:text-slate-400">Invalid GPS Coordinates</p>
        <p className="text-xs text-slate-600 mt-1">Cannot render map for this location.</p>
      </div>
    );
  }

  // Simple iframe embed for MVP - requires Maps Embed API to be enabled
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${API_KEY}&q=${latitude},${longitude}&zoom=15`;

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 group">
      {API_KEY && API_KEY !== "xxx" ? (
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0, filter: "invert(90%) hue-rotate(180deg) brightness(80%) contrast(120%)" }} // Fake dark mode for iframe
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 z-0"
        ></iframe>
      ) : (
        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50">
           <MapIcon size={48} className="text-slate-600 mb-4" />
           <p className="text-slate-600 dark:text-slate-400">Google Maps Integration</p>
           <p className="text-xs text-slate-500 mt-1">Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
        </div>
      )}
      
      {/* Overlay info */}
      <div className="absolute top-3 left-3 z-10 bg-white dark:bg-slate-900/80 backdrop-blur-sm border border-slate-300 dark:border-slate-700 p-2 rounded-lg pointer-events-none">
         <p className="text-[10px] font-mono text-emerald-400">LAT: {latitude.toFixed(6)}</p>
         <p className="text-[10px] font-mono text-blue-400">LNG: {longitude.toFixed(6)}</p>
      </div>
      
      {/* Target Crosshair */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-300">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-red-500/50 -translate-x-1/2"></div>
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-red-500/50 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-4 h-4 border border-red-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
        </div>
      </div>
    </div>
  );
}
