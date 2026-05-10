"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, Heart, Stethoscope, Siren, ArrowRight, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/3 rounded-full blur-[120px]" />
      </div>

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="relative">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-2xl shadow-red-500/30">
              <Activity size={40} className="text-slate-900 dark:text-white" />
            </div>
            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4">
            <span className="text-slate-900 dark:text-white">Medi</span>
            <span className="gradient-text">Link</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            AI-powered emergency medical response.
            <br />
            <span className="text-slate-500">Every second counts.</span>
          </p>
        </motion.div>

        {/* Feature Pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {[
            { icon: Zap, label: "AI Triage", color: "text-amber-400" },
            { icon: Shield, label: "Secure", color: "text-emerald-400" },
            { icon: Clock, label: "Real-time", color: "text-blue-400" },
          ].map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50 text-sm text-slate-700 dark:text-slate-300"
            >
              <feature.icon size={14} className={feature.color} />
              {feature.label}
            </div>
          ))}
        </motion.div>

        {/* Role Selection Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full"
        >
          {[
            {
              title: "Patient Portal",
              description: "Report an emergency & get AI-powered triage instantly",
              icon: Heart,
              href: "/patient",
              color: "blue",
              gradient: "from-blue-600 to-blue-500",
              shadow: "shadow-blue-500/20",
              borderHover: "hover:border-blue-500/40",
              iconBg: "bg-blue-500/10",
              iconColor: "text-blue-400",
            },
            {
              title: "Doctor Hub",
              description: "Review cases, AI analysis & coordinate patient care",
              icon: Stethoscope,
              href: "/doctor",
              color: "emerald",
              gradient: "from-emerald-600 to-emerald-500",
              shadow: "shadow-emerald-500/20",
              borderHover: "hover:border-emerald-500/40",
              iconBg: "bg-emerald-500/10",
              iconColor: "text-emerald-400",
            },
            {
              title: "Emergency Dispatch",
              description: "Coordinate ambulances, track locations & manage response",
              icon: Siren,
              href: "/emergency",
              color: "red",
              gradient: "from-red-600 to-red-500",
              shadow: "shadow-red-500/20",
              borderHover: "hover:border-red-500/40",
              iconBg: "bg-red-500/10",
              iconColor: "text-red-400",
            },
          ].map((role, i) => (
            <Link key={role.href} href={role.href}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
                className={`group relative p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm cursor-pointer transition-all duration-300 ${role.borderHover} hover:bg-white dark:bg-slate-900/80`}
              >
                {/* Icon */}
                <div className={`p-3 rounded-xl ${role.iconBg} w-fit mb-4`}>
                  <role.icon size={24} className={role.iconColor} />
                </div>

                {/* Text */}
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {role.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {role.description}
                </p>

                {/* CTA */}
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:text-white transition-colors">
                  Enter Dashboard
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </div>

                {/* Glow effect on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                />
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 text-xs text-slate-700"
        >
          MediLink Emergency Response Platform — Built for Hackathon 2026
        </motion.p>
      </div>
    </div>
  );
}
