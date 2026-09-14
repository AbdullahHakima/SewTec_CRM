"use client";
import { useDirectory } from "@/lib/auth/use-directory";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import React from "react";
import { CustomerType } from "@/types/crm";
import { Search, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerFiltersProps {
  search: string;
  onSearchChange: (search: string) => void;
  selectedType: CustomerType | "all";
  onTypeChange: (type: CustomerType | "all") => void;
  selectedRep: string;
  onRepChange: (rep: string) => void;
  staleOnly: boolean;
  onStaleOnlyChange: (staleOnly: boolean) => void;
  typeCounts: Record<string, number>;
}
export function CustomerFilters({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedRep,
  onRepChange,
  staleOnly,
  onStaleOnlyChange,
  typeCounts,
}: CustomerFiltersProps) {
  const { people } = useDirectory();
  const segments: { key: CustomerType | "all"; label: string }[] = [
    { key: "all", label: "الكل" },
    { key: "factory", label: "مصانع" },
    { key: "workshop", label: "ورش" },
    { key: "trader", label: "تجار" },
    { key: "individual", label: "أفراد" },
  ];

  return (
    <div className="space-y-3 bg-white dark:bg-stone-900 p-4 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xs">
      {/* Top Row: Search + Rep Selector + Stale Toggle */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            aria-label="بحث العملاء"
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث بالاسم، الهاتف، المنطقة، كود الماكينة..."
            className="w-full rounded-md border border-slate-200 bg-stone-50 dark:bg-stone-800 pr-9 pl-3 py-2 text-sm text-slate-900 dark:text-stone-100 placeholder:text-slate-400 dark:placeholder:text-stone-400 focus:bg-white dark:focus:bg-stone-800/90 border-stone-200 dark:border-stone-700 focus:border-red-500 focus:outline-hidden transition-all"
          />
        </div>

        {/* Rep selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            aria-label="المسؤول عن العميل"
            value={selectedRep}
            onChange={(e) => onRepChange(e.target.value)}
            className="rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-stone-200 focus:border-red-500 focus:outline-hidden"
          >
            <option value="all">كل المسؤولين</option>
            <option value="">المستخدم الحالي</option>{people.map(person => <option key={person.id} value={person.id}>{person.fullName}</option>)}
          </select>

          {/* Stale clients filter button */}
          <button
            aria-pressed={staleOnly}
            onClick={() => onStaleOnlyChange(!staleOnly)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors border",
              staleOnly
                ? "bg-amber-500 text-white border-amber-600 shadow-2xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <AlertTriangle className={cn("h-3.5 w-3.5", staleOnly ? "text-white" : "text-amber-500")} />
            <span>عملاء يحتاجون تواصل</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Segment Pills */}
      <ScrollArea dir="rtl" className="w-full whitespace-nowrap pt-1 border-t border-slate-100 dark:border-stone-800">
        <div className="flex items-center gap-2 pb-2">
          <span className="text-xs font-medium text-slate-400 dark:text-stone-500 shrink-0 ml-1">
            التصنيف:
          </span>
          {segments.map((seg) => {
            const isSelected = selectedType === seg.key;
            const count = typeCounts[seg.key] ?? 0;

            return (
              <button
                key={seg.key}
                aria-pressed={isSelected}
                onClick={() => onTypeChange(seg.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0 cursor-pointer",
                  isSelected
                    ? "bg-primary text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                )}
              >
                <span>{seg.label}</span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-slate-200/80 text-slate-700 dark:bg-stone-700 dark:text-stone-300"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}

