"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type StatusType = "active" | "lead" | "inactive" | "urgent" | "won" | "lost" | "negotiation" | "quotation";

interface StatusBadgeProps {
  status: StatusType | string;
  label?: string;
  pulse?: boolean;
  className?: string;
}

const statusConfig: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string; ping: string }
> = {
  active: {
    label: "عميل نشط",
    bg: "bg-emerald-50/80",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
    ping: "bg-emerald-400",
  },
  lead: {
    label: "عميل محتمل",
    bg: "bg-blue-50/80",
    text: "text-blue-700",
    border: "border-blue-200/80",
    dot: "bg-blue-500",
    ping: "bg-blue-400",
  },
  dormant: { label: "بحاجة لتنشيط", bg: "bg-amber-50/80", text: "text-amber-700", border: "border-amber-200/80", dot: "bg-amber-500", ping: "bg-amber-400" }, inactive: {
    label: "غير نشط / بحاجة لتنشيط",
    bg: "bg-amber-50/80",
    text: "text-amber-700",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
    ping: "bg-amber-400",
  },
  urgent: {
    label: "متأخر / عاجل",
    bg: "bg-rose-50/80",
    text: "text-rose-700",
    border: "border-rose-200/80",
    dot: "bg-rose-500",
    ping: "bg-rose-400",
  },
  quotation: {
    label: "عرض أسعار",
    bg: "bg-indigo-50/80",
    text: "text-indigo-700",
    border: "border-indigo-200/80",
    dot: "bg-indigo-500",
    ping: "bg-indigo-400",
  },
  negotiation: {
    label: "تفاوض",
    bg: "bg-amber-50/80",
    text: "text-amber-700",
    border: "border-amber-200/80",
    dot: "bg-amber-500",
    ping: "bg-amber-400",
  },
  won: {
    label: "تم البيع بنجاح",
    bg: "bg-emerald-50/80",
    text: "text-emerald-700",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
    ping: "bg-emerald-400",
  },
  lost: {
    label: "فرصة مفقودة",
    bg: "bg-stone-50/80",
    text: "text-stone-600",
    border: "border-stone-200/80",
    dot: "bg-stone-400",
    ping: "bg-stone-300",
  },
};

export function StatusBadge({ status, label, pulse = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: label || status,
    bg: "bg-zinc-50",
    text: "text-zinc-700",
    border: "border-zinc-200",
    dot: "bg-zinc-500",
    ping: "bg-zinc-400",
  };

  const displayText = label || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              config.ping
            )}
          />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", config.dot)} />
      </span>
      <span>{displayText}</span>
    </span>
  );
}
