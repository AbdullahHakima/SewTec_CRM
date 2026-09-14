"use client";

import React from "react";
import { Activity } from "@/types/crm";
import { formatBranchRelative, formatBranchDateTime } from "@/lib/dates/branch-time";
import {
  PhoneCall,
  Building2,
  MessageCircle,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  Clock,
} from "lucide-react";
import { formatEgp } from "@/lib/currency/format-currency";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        variant="timeline"
        badge="الخط الزمني للعميل"
        title="لا يوجد سجل تواصل حتى الآن"
        description="استخدم نموذج التسجيل السريع أعلاه لتوثيق أول مكالمة أو زيارة أو رسالة وبدء سجل النشاط."
      />
    );
  }

  const getNodeConfig = (type: string, channel?: string) => {
    if (type === "quotation") {
      return {
        icon: <FileSpreadsheet className="h-4 w-4 text-indigo-600" />,
        border: "border-indigo-200 bg-indigo-50/80 shadow-indigo-100",
      };
    }
    if (type === "followup_completed") {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
        border: "border-emerald-200 bg-emerald-50/80 shadow-emerald-100",
      };
    }
    if (type === "stage_change") {
      return {
        icon: <TrendingUp className="h-4 w-4 text-amber-600" />,
        border: "border-amber-200 bg-amber-50/80 shadow-amber-100",
      };
    }
    if (channel === "call") {
      return {
        icon: <PhoneCall className="h-4 w-4 text-blue-600" />,
        border: "border-blue-200 bg-blue-50/80 shadow-blue-100",
      };
    }
    if (channel === "visit") {
      return {
        icon: <Building2 className="h-4 w-4 text-purple-600" />,
        border: "border-purple-200 bg-purple-50/80 shadow-purple-100",
      };
    }
    if (channel === "whatsapp") {
      return {
        icon: <MessageCircle className="h-4 w-4 text-emerald-600" />,
        border: "border-emerald-200 bg-emerald-50/80 shadow-emerald-100",
      };
    }
    return {
      icon: <FileText className="h-4 w-4 text-zinc-600" />,
      border: "border-stone-200 bg-stone-50 shadow-stone-100",
    };
  };

  return (
    <div className="space-y-4">
      <div className="relative border-r-2 border-stone-200 mr-3 pr-6 space-y-5">
        {activities.map((act) => {
          const node = getNodeConfig(act.type, act.metadata?.channel);

          return (
            <div key={act.id} className="relative group">
              {/* Bullet Node with colored badge */}
              <div
                className={cn(
                  "absolute -right-[33px] top-2 flex h-7 w-7 items-center justify-center rounded-xl border shadow-sm transition-transform duration-200 group-hover:scale-110",
                  node.border
                )}
              >
                {node.icon}
              </div>

              {/* Event Content Card */}
              <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-2xs hover:border-stone-300 hover:shadow-xs transition-all">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-900">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-zinc-400 bg-stone-50 px-2 py-0.5 rounded-full border border-stone-100">
                      بواسطة {act.performedBy}
                    </span>
                  </div>
                  <span
                    className="text-[11px] text-zinc-400 tabular-nums shrink-0 font-medium"
                    title={formatBranchDateTime(act.occurredAt)}
                  >
                    {formatBranchRelative(act.occurredAt)}
                  </span>
                </div>

                <p className="text-xs text-zinc-700 leading-relaxed">
                  {act.description}
                </p>

                {/* Dense Metadata Pills */}
                {act.metadata && (
                  <div className="flex items-center gap-2 flex-wrap mt-3 pt-2.5 border-t border-stone-100 text-[11px]">
                    {act.metadata.quotationRef && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50/80 border border-indigo-200/80 px-2 py-0.5 text-indigo-700 font-mono font-bold text-[10px]" dir="ltr">
                        عرض: {act.metadata.quotationRef}
                      </span>
                    )}
                    {act.metadata.machineModel && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-stone-100 border border-stone-200 px-2 py-0.5 text-zinc-700 font-mono font-semibold text-[10px]" dir="ltr">
                        {act.metadata.machineModel}
                      </span>
                    )}
                    {act.metadata.amount && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50/80 border border-emerald-200/80 px-2.5 py-0.5 text-emerald-700 font-bold tabular-nums text-[10px]">
                        {formatEgp(act.metadata.amount)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
