"use client";

import Link from "next/link";
import { ArrowUpLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { NumberTicker } from "@/components/ui/number-ticker";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  href,
  alert = false,
  progress,
}: {
  label: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
  href: string;
  alert?: boolean;
  progress?: number;
}) {
  const renderValue = () => {
    if (typeof value === "number") {
      return <NumberTicker value={value} />;
    }
    if (typeof value === "string") {
      const match = value.match(/^([0-9,]+)s*(.*)$/);
      if (match) {
        const num = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(num)) {
          return <><NumberTicker value={num} />{match[2] && <span> {match[2]}</span>}</>;
        }
      }
    }
    return value;
  };

  return (
    <Link
      href={href}
      className={cn(
        "metric-card group relative overflow-hidden transition-all duration-300",
        alert && "metric-alert"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-zinc-500">{label}</span>
        <span
          className={cn(
            "metric-icon transition-transform duration-200 group-hover:scale-105",
            alert && "bg-rose-100/70 text-rose-600"
          )}
        >
          <Icon size={18} strokeWidth={1.7} />
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-2">
        <strong className="text-3xl font-bold tracking-tight text-zinc-900 tabular-nums">
          {renderValue()}
        </strong>
        <ArrowUpLeft
          size={18}
          className="mb-1 text-zinc-300 transition-all duration-200 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:text-red-600"
        />
      </div>

      <p className="mt-3 text-[11px] leading-6 text-zinc-500">{detail}</p>

      {progress !== undefined && (
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-label={label}
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-600 transition-[width] duration-700 ease-out"
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </Link>
  );
}
