"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Bell,
  ChevronDown,
  UserCheck,
  PhoneCall,
  CalendarPlus,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useFollowUps } from "@/features/follow-ups/hooks/use-follow-ups";
import { GlobalSearchDialog } from "./GlobalSearchDialog";
import Link from "next/link";

interface TopBarProps {
  onQuickAction?: (action: "call" | "followup" | "opportunity" | "customer") => void;
}

export function TopBar({ onQuickAction }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { counts } = useFollowUps();

  const handleActionClick = (action: "call" | "followup" | "opportunity" | "customer") => {
    setMenuOpen(false);
    if (onQuickAction) {
      onQuickAction(action);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 md:px-6">
        {/* Search Bar Trigger */}
        <div className="flex-1 max-w-lg">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-right text-sm text-slate-500 hover:border-slate-300 hover:bg-slate-100/70 transition-all shadow-2xs"
          >
            <div className="flex items-center gap-2.5">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">
                ابحث باسم العميل، الهاتف (010...)، أو كود الماكينة...
              </span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-400 border border-slate-200 shadow-2xs">
              <span className="text-xs">Ctrl</span> K
            </kbd>
          </button>
        </div>

        {/* Right Side Tools */}
        <div className="flex items-center gap-3">
          {/* Quick Action Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-md bg-[#0f2744] px-3.5 py-2 text-sm font-medium text-white shadow-xs hover:bg-[#153a63] transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>إجراء جديد</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>

            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-1.5 shadow-lg z-30 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    onClick={() => handleActionClick("customer")}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors text-right"
                  >
                    <UserPlus className="h-4 w-4 text-blue-600" />
                    <span>إضافة عميل جديد</span>
                  </button>
                  <button
                    onClick={() => handleActionClick("call")}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors text-right"
                  >
                    <PhoneCall className="h-4 w-4 text-emerald-600" />
                    <span>تسجيل مكالمة / زيارة</span>
                  </button>
                  <button
                    onClick={() => handleActionClick("followup")}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors text-right"
                  >
                    <CalendarPlus className="h-4 w-4 text-amber-600" />
                    <span>جدولة متابعة جديدة</span>
                  </button>
                  <button
                    onClick={() => handleActionClick("opportunity")}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors text-right border-t border-slate-100 mt-1 pt-2"
                  >
                    <Sparkles className="h-4 w-4 text-indigo-600" />
                    <span>إنشاء فرصة بيعية</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Notifications Bell */}
          <Link
            href="/follow-ups?view=overdue"
            className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
            title="المتابعات المتأخرة"
          >
            <Bell className="h-5 w-5" />
            {counts.overdue > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white tabular-nums ring-2 ring-white">
                {counts.overdue}
              </span>
            )}
          </Link>

          <div className="h-5 w-px bg-slate-200" />

          {/* User Profile Info */}
          <div className="flex items-center gap-2.5 pl-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-sm">
              <UserCheck className="h-4 w-4 text-slate-600" />
            </div>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-800">
                أحمد شحاتة
              </span>
              <span className="text-[11px] text-slate-500">
                مبيعات فرع المحلة
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette */}
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
