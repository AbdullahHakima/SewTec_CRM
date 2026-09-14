"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { crmStore } from "@/lib/storage/crm-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/auth/auth-context";

const emptySubscribe = () => () => {};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="sewtec-theme"
      disableTransitionOnChange
    >
      <AuthProvider>
        <ClientProviders>{children}</ClientProviders>
      </AuthProvider>
    </ThemeProvider>
  );
}

function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    crmStore.initClient();
  }, []);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <div role="status" aria-label="جاري تحميل SewTec CRM" className="min-h-screen bg-[#f7f6f4] p-6 md:p-10">
        <p className="mb-8 text-sm font-semibold text-zinc-500">جاري تحميل SewTec CRM...</p>
        <div aria-hidden="true" className="mx-auto max-w-7xl space-y-6">
          <Skeleton className="h-14 w-full rounded-2xl bg-stone-200/60" />
          <Skeleton className="h-60 rounded-3xl bg-stone-200/60" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-40 rounded-2xl bg-stone-200/60" />)}</div>
        </div>
      </div>
    );
  }

  return <TooltipProvider delayDuration={350}>{children}</TooltipProvider>;
}
