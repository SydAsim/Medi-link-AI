"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  Stethoscope,
  Siren,
  Menu,
  X,
  Activity,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "Patient Portal",
    href: "/patient",
    icon: Heart,
    role: "patient" as const,
    description: "Submit emergency cases",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    hoverBg: "hover:bg-blue-500/15",
  },
  {
    title: "Doctor Hub",
    href: "/doctor",
    icon: Stethoscope,
    role: "doctor" as const,
    description: "Review & triage cases",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    hoverBg: "hover:bg-emerald-500/15",
  },
  {
    title: "Emergency Dispatch",
    href: "/emergency",
    icon: Siren,
    role: "emergency" as const,
    description: "Coordinate response",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    hoverBg: "hover:bg-red-500/15",
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:text-white backdrop-blur-sm"
        id="sidebar-mobile-toggle"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full bg-slate-50 dark:bg-slate-950/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/80 flex flex-col transition-all duration-300",
          collapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          className
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Activity size={22} className="text-slate-900 dark:text-white" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
          </div>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Medi<span className="text-red-400">Link</span>
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                Emergency Response
              </p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {!collapsed && (
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-4 px-3">
              Dashboards
            </p>
          )}
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                id={`nav-${item.role}`}
              >
                <motion.div
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                    isActive
                      ? `${item.bgColor} ${item.borderColor} border`
                      : `hover:bg-slate-100 dark:bg-slate-800/50 border border-transparent`
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-gradient-to-b from-red-400 to-red-600"
                    />
                  )}
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive ? item.bgColor : "bg-slate-100 dark:bg-slate-800/50 group-hover:bg-slate-100 dark:bg-slate-800"
                    )}
                  >
                    <Icon
                      size={18}
                      className={cn(
                        isActive ? item.color : "text-slate-500 group-hover:text-slate-700 dark:text-slate-300"
                      )}
                    />
                  </div>
                  {!collapsed && (
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium truncate",
                          isActive ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-800 dark:text-slate-200"
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-600 truncate">
                        {item.description}
                      </p>
                    </div>
                  )}
                  {!collapsed && isActive && (
                    <ChevronRight size={14} className={item.color} />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800/80">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/30">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-slate-500">System Online</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full mt-2 p-2 rounded-lg hover:bg-slate-100 dark:bg-slate-800/50 text-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors"
            id="sidebar-collapse-toggle"
          >
            <ChevronRight
              size={16}
              className={cn(
                "transition-transform duration-300",
                collapsed ? "" : "rotate-180"
              )}
            />
          </button>
        </div>
      </motion.aside>
    </>
  );
}
