"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "default" | "search" | "celebrate" | "action" | "timeline";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: EmptyStateVariant;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  badge?: string;
  className?: string;
}

const variantStyles: Record<EmptyStateVariant, { iconBg: string; iconColor: string; badgeBg: string; badgeText: string }> = {
  default: { iconBg: "bg-stone-100 border-stone-200", iconColor: "text-stone-600", badgeBg: "bg-stone-100", badgeText: "text-stone-700" },
  search: { iconBg: "bg-amber-50 border-amber-200", iconColor: "text-amber-600", badgeBg: "bg-amber-100", badgeText: "text-amber-800" },
  celebrate: { iconBg: "bg-emerald-50 border-emerald-200", iconColor: "text-emerald-600", badgeBg: "bg-emerald-100", badgeText: "text-emerald-800" },
  action: { iconBg: "bg-red-50 border-red-200", iconColor: "text-red-600", badgeBg: "bg-red-100", badgeText: "text-red-800" },
  timeline: { iconBg: "bg-indigo-50 border-indigo-200", iconColor: "text-indigo-600", badgeBg: "bg-indigo-100", badgeText: "text-indigo-800" },
};

export function EmptyState({ icon: Icon, title, description, variant = "default", action, secondaryAction, badge, className }: EmptyStateProps) {
  const styles = variantStyles[variant];

  return (
    <div role="status" className={cn("rounded-2xl border border-stone-200 bg-white p-8 text-center sm:p-12", className)}>
      {badge && (
        <div className="mb-4 inline-flex">
          <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold", styles.badgeBg, styles.badgeText)}>{badge}</span>
        </div>
      )}

      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-transparent" >
        <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl border", styles.iconBg)}>
          <Icon className={cn("h-7 w-7", styles.iconColor)} />
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-2">
        <h3 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h3>
        <p className="text-xs leading-relaxed text-slate-500 sm:text-sm">{description}</p>
      </div>

      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action && (
            <Button onClick={action.onClick} variant={action.variant || "default"} className="h-10 gap-2 rounded-xl px-5 font-bold">
              {action.icon && <action.icon className="h-4 w-4" />}
              <span>{action.label}</span>
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant={secondaryAction.variant || "outline"} className="h-10 gap-1.5 rounded-xl border-stone-200 px-4 text-xs font-semibold text-slate-600 hover:bg-stone-50">
              {secondaryAction.icon && <secondaryAction.icon className="h-3.5 w-3.5" />}
              <span>{secondaryAction.label}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}