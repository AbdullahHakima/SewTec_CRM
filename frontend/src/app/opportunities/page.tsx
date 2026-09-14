"use client";

import { OpportunitiesScreen } from "@/features/opportunities/components/OpportunitiesScreen";
import { Suspense } from "react";

export default function OpportunitiesPage() {
  return <Suspense fallback={<div className="surface-card p-8 text-sm text-zinc-500">جاري تحميل الفرص البيعية...</div>}><OpportunitiesScreen /></Suspense>;
}
