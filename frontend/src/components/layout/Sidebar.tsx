"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  CheckSquare,
  Settings,
  ChevronRight,
  ChevronLeft,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFollowUps } from "@/features/follow-ups/hooks/use-follow-ups";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { counts } = useFollowUps();

  const navItems = [
    {
      href: "/",
      label: "الرئيسية",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      href: "/customers",
      label: "العملاء",
      icon: Users,
      badge: null,
    },
    {
      href: "/opportunities",
      label: "الفرص البيعية",
      icon: TrendingUp,
      badge: null,
    },
    {
      href: "/follow-ups",
      label: "المتابعات",
      icon: CheckSquare,
      badge: counts.overdue > 0 ? `${counts.overdue} متأخرة` : null,
      badgeAlert: counts.overdue > 0,
    },
    {
      href: "/settings",
      label: "الإعدادات",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside
      className={cn(
        "relative flex flex-col border-l border-slate-200 bg-white transition-all duration-200 z-30 select-none",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
        {!collapsed ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-[#0f2744]">
                SEWTEC
              </span>
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                CRM
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              فرع المحلة الكبرى
            </span>
          </div>
        ) : (
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f2744] text-white font-bold text-sm">
            S
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          title={collapsed ? "توسيع القائمة" : "طي القائمة"}
        >
          {collapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-1.5 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-[#0f2744] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              />

              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                    item.badgeAlert
                      ? isActive
                        ? "bg-rose-500 text-white"
                        : "bg-rose-100 text-rose-700"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {item.badge}
                </span>
              )}

              {collapsed && item.badge && item.badgeAlert && (
                <span className="absolute top-2 left-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Branch Footer */}
      {!collapsed ? (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 m-2 rounded-lg text-xs text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Building2 className="h-3.5 w-3.5 text-blue-600" />
            <span>وردية المبيعات المباشرة</span>
          </div>
          <p className="text-[11px] text-slate-400">
            منطقة الغزل والمشاغل الصناعية
          </p>
        </div>
      ) : null}
    </aside>
  );
}
