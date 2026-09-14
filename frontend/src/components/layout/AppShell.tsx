"use client";
import dynamic from "next/dynamic";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
const CustomerDrawer = dynamic(() => import("@/features/customers/components/CustomerDrawer").then(module => module.CustomerDrawer));
const FollowUpDrawer = dynamic(() => import("@/features/follow-ups/components/FollowUpDrawer").then(module => module.FollowUpDrawer));
const OpportunityDrawer = dynamic(() => import("@/features/opportunities/components/OpportunityDrawer").then(module => module.OpportunityDrawer));
const LogInteractionDrawer = dynamic(() => import("@/features/interactions/components/LogInteractionDrawer").then(module => module.LogInteractionDrawer));
const LoginScreen = dynamic(() => import("@/features/auth/components/LoginScreen").then(module => module.LoginScreen));
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [activeAction, setActiveAction] = useState<
    "call" | "followup" | "opportunity" | "customer" | null
  >(null);

  if (isLoading) {
    return (
      <div role="status" aria-label="جاري التحقق من الجلسة" className="min-h-screen bg-[#f7f6f4] p-6 md:p-10" dir="rtl">
        <div className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-14 w-full rounded-2xl bg-stone-200/60" />
          <Skeleton className="h-60 rounded-3xl bg-stone-200/60" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="crm-shell flex min-h-screen font-sans text-slate-900" dir="rtl">
      <a href="#workspace" className="skip-link">انتقل إلى المحتوى</a>
      {/* Pinned Right Sidebar in RTL */}
      <Sidebar />

      {/* Main Workspace expands to the left */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar onQuickAction={setActiveAction} />
        <main id="workspace" className="workspace flex-1 min-w-0 p-4 md:p-6 lg:p-8" tabIndex={-1}>
          {children}
        </main>
      </div>

      {/* Global Quick Action Drawers */}
      {activeAction === "customer" && <CustomerDrawer
        open={activeAction === "customer"}
        onClose={() => setActiveAction(null)}
        onCustomerCreated={(id) => router.push(`/customers/${id}`)}
      />}

      {activeAction === "followup" && <FollowUpDrawer
        open={activeAction === "followup"}
        onClose={() => setActiveAction(null)}
      />}

      {activeAction === "opportunity" && <OpportunityDrawer
        open={activeAction === "opportunity"}
        onClose={() => setActiveAction(null)}
        onSuccess={() => router.push("/opportunities")}
      />}

      {activeAction === "call" && <LogInteractionDrawer
        open={activeAction === "call"}
        onClose={() => setActiveAction(null)}
      />}
    </div>
  );
}
