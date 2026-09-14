"use client";

import { Suspense } from "react";
import { CatalogScreen } from "@/features/catalog/components/CatalogScreen";

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-8 flex items-center justify-center">
          <div className="surface-card p-8 text-sm text-zinc-500">
            جاري تحميل كتالوج الماكينات والأسعار...
          </div>
        </div>
      }
    >
      <CatalogScreen />
    </Suspense>
  );
}

