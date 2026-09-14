"use client";

import { CheckSquare, AlertTriangle, FileSpreadsheet, TrendingUp } from "lucide-react";
import { formatEgp } from "@/lib/currency/format-currency";
import { MetricCard } from "@/components/ui/metric-card";

interface KpiCardsProps {
  todayCount: number;
  completedTodayCount: number;
  overdueCount: number;
  quotationCount: number;
  negotiationCount: number;
  negotiationTotalValue: number;
}

export function KpiCards({ todayCount, completedTodayCount, overdueCount, quotationCount, negotiationCount, negotiationTotalValue }: KpiCardsProps) {
  return <div className="dashboard-metrics grid grid-cols-2 gap-3 xl:grid-cols-4">
    <MetricCard href="/follow-ups?view=today" label="متابعات اليوم" value={todayCount} detail={`${completedTodayCount} مكتملة • ${Math.max(0, todayCount - completedTodayCount)} متبقية`} icon={CheckSquare} progress={todayCount ? completedTodayCount / todayCount * 100 : 0} />
    <MetricCard href="/follow-ups?view=overdue" label="تحتاج انتباهك" value={overdueCount} detail={overdueCount ? "متابعات متأخرة — حان وقت التواصل" : "كل شيء تحت السيطرة. لا توجد متأخرات."} icon={AlertTriangle} alert={overdueCount > 0} />
    <MetricCard href="/opportunities?stage=quotation" label="عروض أسعار مفتوحة" value={quotationCount} detail="عروض مرسلة بانتظار قرار العميل" icon={FileSpreadsheet} />
    <MetricCard href="/opportunities?stage=negotiation" label="قيمة فرص التفاوض" value={formatEgp(negotiationTotalValue)} detail={`${negotiationCount} فرص في مرحلة التفاوض`} icon={TrendingUp} />
  </div>;
}
