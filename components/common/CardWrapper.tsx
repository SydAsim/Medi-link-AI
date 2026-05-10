"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardWrapperProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  delay?: number;
}

export function CardWrapper({
  children,
  className,
  hover = true,
  delay = 0,
}: CardWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      className={cn(
        "rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-sm p-6 shadow-xl transition-colors",
        hover && "hover:border-slate-300 dark:border-slate-700 hover:bg-white dark:bg-slate-900/70",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
