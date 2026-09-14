"use client";

import React from "react";
import { Cpu, CheckCircle2, ShieldCheck, Tag } from "lucide-react";
import { formatEgp } from "@/lib/currency/format-currency";

interface CatalogStatsProps {
  summary: { all: number; inStock: number; totalStockUnits: number; brands: string[]; minPrice: number; maxPrice: number };
  filteredCount: number;
}

export function CatalogStats({ summary, filteredCount }: CatalogStatsProps) {
  const { all: totalCount, inStock: inStockCount, totalStockUnits, brands, minPrice, maxPrice } = summary;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {/* Total Models */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            إجمالي الموديلات بالكتالوج
          </span>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/60 p-2 text-blue-600 dark:text-blue-400">
            <Cpu size={16} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
            {totalCount}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">موديل معتمد</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          معروض حالياً: <span className="font-semibold text-blue-600 dark:text-blue-400">{filteredCount}</span> ماكينة
        </p>
      </div>

      {/* In-Stock & Ready */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            تسليم فوري من المخزن
          </span>
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 p-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={16} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {inStockCount}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">موديل متاح</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          إجمالي الرصيد: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{totalStockUnits}</span> ماكينة بالمحلة
        </p>
      </div>

      {/* Brands Supported */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            العلامات التجارية المعتمدة
          </span>
          <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 p-2 text-indigo-600 dark:text-indigo-400">
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-indigo-600 dark:text-indigo-400">
            {brands.length}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">ماركات عالمية</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400 truncate">
          {brands.join(" • ")}
        </p>
      </div>

      {/* Price Range */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            نطاق الأسعار الحالية
          </span>
          <div className="rounded-lg bg-amber-50 dark:bg-amber-950/60 p-2 text-amber-600 dark:text-amber-400">
            <Tag size={16} />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
            {formatEgp(minPrice)}
          </span>
          <span className="text-xs text-slate-400">إلى</span>
          <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
            {formatEgp(maxPrice)}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">
          أسعار كاش معتمدة شاملة الضريبة
        </p>
      </div>
    </div>
  );
}

