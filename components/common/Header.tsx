"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Bell, Search, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  "/patient": {
    title: "Patient Emergency Portal",
    subtitle: "Submit and track emergency cases",
  },
  "/doctor": {
    title: "Doctor Command Center",
    subtitle: "Review, triage, and manage cases",
  },
  "/emergency": {
    title: "Emergency Dispatch Hub",
    subtitle: "Coordinate emergency response",
  },
};

export function Header() {
  const pathname = usePathname();
  const routeInfo = routeTitles[pathname || ""] || {
    title: "MediLink",
    subtitle: "Emergency Response Platform",
  };

  const breadcrumbs = pathname
    ? pathname
        .split("/")
        .filter(Boolean)
        .map((segment, index, arr) => ({
          label: segment.charAt(0).toUpperCase() + segment.slice(1),
          href: "/" + arr.slice(0, index + 1).join("/"),
          isLast: index === arr.length - 1,
        }))
    : [];

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-30 w-full bg-slate-50 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80"
    >
      <div className="flex items-center justify-between h-16 px-6 lg:px-8">
        {/* Left: Title & Breadcrumbs */}
        <div className="flex flex-col">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-600">MediLink</span>
            {breadcrumbs.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <span className="text-slate-700">/</span>
                <span
                  className={cn(
                    crumb.isLast ? "text-slate-700 dark:text-slate-300" : "text-slate-500"
                  )}
                >
                  {crumb.label}
                </span>
              </span>
            ))}
          </div>
          {/* Title */}
          <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
            {routeInfo.title}
          </h2>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Live clock */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700/50">
            <Clock size={12} className="text-slate-500" />
            <LiveClock />
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Search */}
          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800/50 text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors"
            id="header-search-btn"
          >
            <Search size={18} />
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800/50 text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors"
            id="header-notifications-btn"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </button>

          {/* Avatar */}
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-slate-900 dark:text-white text-xs font-bold shadow-lg shadow-red-500/20">
            M
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function LiveClock() {
  // Using a simple client-side approach
  const now = new Date();
  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono">{time}</span>;
}
