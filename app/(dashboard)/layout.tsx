"use client";

import { Sidebar } from "@/components/common/Sidebar";
import { Header } from "@/components/common/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="lg:pl-72 transition-all duration-300">
        <Header />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
