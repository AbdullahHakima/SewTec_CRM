"use client";

import React, { useState } from "react";
import { Settings, Building2, Users, Database, RotateCcw, Clock, ShieldCheck } from "lucide-react";
import { ResetDemoDialog } from "./ResetDemoDialog";

export function SettingsScreen() {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f2744] text-white">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">إعدادات النظام والفرع</h1>
          <p className="text-xs text-slate-500">
            تكوين فرع المحلة الكبرى • إعدادات البيئة التجريبية والمسؤولين
          </p>
        </div>
      </div>

      {/* 1. Branch Metadata Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Building2 className="h-4 w-4 text-blue-600" />
          <h2 className="font-bold text-sm text-slate-900">
            بيانات الفرع والمنطقة التشغيلية
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">اسم الفرع</span>
            <span className="font-bold text-slate-800">SewTec — فرع المحلة الكبرى الرئيسي</span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">النشاط الرئيسي</span>
            <span className="font-medium text-slate-800">
              توريد وصيانة ماكينات الخياطة الصناعية وتجهيز خطوط الإنتاج
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">النطاق الجغرافي</span>
            <span className="font-medium text-slate-800">
              محافظة الغربية (المحلة الكبرى، طنطا، سمنود، زفتى)
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px] mb-0.5">التوقيت المعتمد</span>
            <span className="font-mono text-slate-800 flex items-center gap-1 mt-0.5" dir="ltr">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Africa/Cairo (توقيت القاهرة)</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Sales Representatives */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Users className="h-4 w-4 text-emerald-600" />
          <h2 className="font-bold text-sm text-slate-900">
            مسؤولو المبيعات والمتابعة بالفرع
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                أش
              </div>
              <div>
                <span className="font-bold text-slate-900 block">أحمد شحاتة</span>
                <span className="text-[11px] text-slate-500">مسؤول مبيعات أول كبار العملاء</span>
              </div>
            </div>
            <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
              نشط
            </span>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-800 font-bold text-xs">
                مس
              </div>
              <div>
                <span className="font-bold text-slate-900 block">محمد السيد</span>
                <span className="text-[11px] text-slate-500">مسؤول مبيعات المشاغل والورش</span>
              </div>
            </div>
            <span className="rounded bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
              نشط
            </span>
          </div>
        </div>
      </div>

      {/* 3. Developer & Demo Mode Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-amber-600" />
            <h2 className="font-bold text-sm text-slate-900">
              بيئة العرض التجريبي وإدارة البيانات
            </h2>
          </div>
          <span className="rounded bg-amber-50 border border-amber-200 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
            وضع النموذج التجريبي (Mock Engine)
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900">
              إعادة ضبط البيانات التجريبية
            </h3>
            <p className="text-[11px] text-slate-500 max-w-md leading-relaxed">
              إذا قمت بتجربة إضافة عملاء جدد أو تحريك صفقات وتريد استعادة الحالة الأولية المعتمدة لفرع المحلة الكبرى، يمكنك الضغط هنا لإعادة التهيئة.
            </p>
          </div>

          <button
            onClick={() => setResetDialogOpen(true)}
            className="flex items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-white px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 shadow-2xs transition-colors shrink-0"
          >
            <RotateCcw className="h-4 w-4 text-rose-600" />
            <span>إعادة ضبط البيانات التجريبية</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ResetDemoDialog
        open={resetDialogOpen}
        onClose={() => setResetDialogOpen(false)}
      />
    </div>
  );
}
