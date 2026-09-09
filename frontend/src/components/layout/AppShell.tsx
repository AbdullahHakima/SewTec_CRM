"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  // Global quick action drawer trigger state (used across screens)
  const [activeAction, setActiveAction] = useState<
    "call" | "followup" | "opportunity" | "customer" | null
  >(null);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
      {/* Pinned Right Sidebar in RTL */}
      <Sidebar />

      {/* Main Workspace expands to the left */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar onQuickAction={setActiveAction} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
