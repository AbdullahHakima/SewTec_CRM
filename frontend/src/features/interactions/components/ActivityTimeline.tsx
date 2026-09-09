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
} from "lucide-react";
import { formatEgp } from "@/lib/currency/format-currency";

interface ActivityTimelineProps {
  activities: Activity[];
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-400 text-xs">
        <FileText className="h-6 w-6 mx-auto mb-2 text-slate-300" />
        <p className="font-semibold text-slate-600">لا يوجد سجل تواصل حتى الآن</p>
        <p className="mt-0.5">استخدم مربع التسجيل السريع أعلاه لإضافة أول تواصل</p>
      </div>
    );
  }

  const getIcon = (type: string, channel?: string) => {
    if (type === "quotation") {
      return <FileSpreadsheet className="h-4 w-4 text-indigo-600" />;
    }
    if (type === "followup_completed") {
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }
    if (type === "stage_change") {
      return <TrendingUp className="h-4 w-4 text-amber-600" />;
    }
    if (channel === "call") {
      return <PhoneCall className="h-4 w-4 text-blue-600" />;
    }
    if (channel === "visit") {
      return <Building2 className="h-4 w-4 text-purple-600" />;
    }
    if (channel === "whatsapp") {
      return <MessageCircle className="h-4 w-4 text-green-600" />;
    }
    return <FileText className="h-4 w-4 text-slate-600" />;
  };

  return (
    <div className="space-y-4">
      <div className="relative border-r-2 border-slate-200 mr-3 pr-5 space-y-6">
        {activities.map((act) => {
          const icon = getIcon(act.type, act.metadata?.channel);

          return (
            <div key={act.id} className="relative group">
              {/* Bullet Node */}
              <div className="absolute -right-[27px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white border-2 border-slate-300 shadow-xs">
                {icon}
              </div>

              {/* Event Content */}
              <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      {act.title}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      بواسطة {act.performedBy}
                    </span>
                  </div>
                  <span
                    className="text-[11px] text-slate-400 tabular-nums shrink-0"
                    title={formatBranchDateTime(act.occurredAt)}
                  >
                    {formatBranchRelative(act.occurredAt)}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {act.description}
                </p>

                {/* Metadata Pills */}
                {act.metadata && (
                  <div className="flex items-center gap-2 flex-wrap mt-2.5 pt-2 border-t border-slate-100 text-[11px]">
                    {act.metadata.quotationRef && (
                      <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-indigo-700 font-mono font-bold" dir="ltr">
                        عرض: {act.metadata.quotationRef}
                      </span>
                    )}
                    {act.metadata.machineModel && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-slate-700 font-mono font-semibold" dir="ltr">
                        {act.metadata.machineModel}
                      </span>
                    )}
                    {act.metadata.amount && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-700 font-bold tabular-nums">
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
