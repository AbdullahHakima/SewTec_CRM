"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { crmStore } from "@/lib/storage/crm-store";

const emptySubscribe = () => () => {};

export default function Providers({ children }: { children: React.ReactNode }) {
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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
          <p className="text-sm font-medium">جاري تحميل SewTec CRM...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
