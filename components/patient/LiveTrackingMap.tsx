"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Truck, Navigation, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveTrackingMapProps {
  patientLat: number;
  patientLng: number;
  ambulanceLat?: number;
  ambulanceLng?: number;
  status: string;
  eta?: string;
}

export function LiveTrackingMap({ 
  patientLat, 
  patientLng, 
  ambulanceLat, 
  ambulanceLng, 
  status,
  eta = "8-12 mins"
}: LiveTrackingMapProps) {
  const [showMap, setShowMap] = useState(true);
  
  // Simulation of ambulance movement if no real coords provided
  const [simLat, setSimLat] = useState(patientLat + 0.005);
  const [simLng, setSimLng] = useState(patientLng + 0.005);

  useEffect(() => {
    if (status === "dispatched" || status === "en-route") {
      const interval = setInterval(() => {
        setSimLat(prev => prev > patientLat ? prev - 0.0001 : prev);
        setSimLng(prev => prev > patientLng ? prev - 0.0001 : prev);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status, patientLat, patientLng]);

  const activeLat = ambulanceLat || simLat;
  const activeLng = ambulanceLng || simLng;

  const isAtDestination = Math.abs(activeLat - patientLat) < 0.0005 && Math.abs(activeLng - patientLng) < 0.0005;

  return (
    <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden h-64 shadow-inner">
      {/* Map Background (Visual Placeholder for Demo) */}
      <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        </div>
        
        {/* Patient House Marker */}
        <motion.div 
          className="absolute z-10"
          style={{ 
            left: '50%', 
            top: '50%', 
            transform: 'translate(-50%, -50%)' 
          }}
        >
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-red-500/20 animate-ping absolute -inset-0" />
            <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center border-2 border-white shadow-lg relative z-10">
              <MapPin size={12} className="text-white" />
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
              Your Location
            </div>
          </div>
        </motion.div>

        {/* Ambulance Marker */}
        <AnimatePresence>
          {(status === "dispatched" || status === "en-route" || status === "arrived") && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                left: isAtDestination ? '50%' : '30%', 
                top: isAtDestination ? '50%' : '30%',
              }}
              className="absolute z-20"
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <div className="relative">
                <div className="h-8 w-8 rounded-full bg-blue-500/30 animate-pulse absolute -inset-0" />
                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white shadow-xl relative z-10">
                  <Truck size={12} className="text-white" />
                </div>
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shadow-lg">
                  Ambulance 05
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Routing Line (Visual only) */}
        {(status === "dispatched" || status === "en-route") && !isAtDestination && (
          <div className="absolute top-[30%] left-[30%] right-[50%] bottom-[50%] border-b-2 border-l-2 border-dashed border-blue-400/30 rounded-bl-3xl" />
        )}
      </div>

      {/* Overlay Info */}
      <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-xl flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Navigation size={16} className="text-emerald-400 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estimated Arrival</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">
              {isAtDestination ? "Arrived at Scene" : eta}
            </p>
          </div>
        </div>

        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-xl flex items-center gap-2">
          <ShieldCheck size={14} className="text-blue-400" />
          <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">Secure Channel</span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 right-4 z-30">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-xl flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">
              {status === "arrived" ? "Emergency Team Arrived" : "Ambulance En-Route"}
            </span>
          </div>
          <div className="text-[9px] text-slate-400 font-mono">
            ID: DISPATCH_05_G10
          </div>
        </div>
      </div>
    </div>
  );
}
