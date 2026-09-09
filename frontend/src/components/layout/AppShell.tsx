"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CustomerDrawer } from "@/features/customers/components/CustomerDrawer";
import { FollowUpDrawer } from "@/features/follow-ups/components/FollowUpDrawer";
import { OpportunityDrawer } from "@/features/opportunities/components/OpportunityDrawer";
import { LogInteractionDrawer } from "@/features/interactions/components/LogInteractionDrawer";
import { useRouter } from "next/navigation";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
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

      {/* Global Quick Action Drawers */}
      <CustomerDrawer
        open={activeAction === "customer"}
        onClose={() => setActiveAction(null)}
        onCustomerCreated={(id) => router.push(`/customers/${id}`)}
      />

      <FollowUpDrawer
        open={activeAction === "followup"}
        onClose={() => setActiveAction(null)}
      />

      <OpportunityDrawer
        open={activeAction === "opportunity"}
        onClose={() => setActiveAction(null)}
        onSuccess={() => router.push("/opportunities")}
      />

      <LogInteractionDrawer
        open={activeAction === "call"}
        onClose={() => setActiveAction(null)}
      />
    </div>
  );
}
