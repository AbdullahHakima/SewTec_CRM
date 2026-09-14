"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  CheckSquare,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  ArrowUpLeft,
  MapPin,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFollowUps } from "@/features/follow-ups/hooks/use-follow-ups";

const navigation = [
  { href: "/", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/customers", label: "العملاء", icon: Users },
  { href: "/opportunities", label: "الفرص البيعية", icon: TrendingUp },
  { href: "/catalog", label: "كتالوج الماكينات", icon: Cpu },
  { href: "/follow-ups", label: "المتابعات", icon: CheckSquare },
  { href: "/settings", label: "الإعدادات", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { counts } = useFollowUps();

  return (
    <aside className={cn("crm-sidebar", collapsed && "is-collapsed")}>
      <div className="sidebar-brand">
        <Link href="/" aria-label="SewTec — الرئيسية" className="flex items-center gap-3">
          <Image src="/images/sewtec-logo.png" alt="" width={44} height={44} className="rounded-full" />
          <div className="sidebar-expanded">
            <div className="text-xl font-bold tracking-wider" dir="ltr">
              <span className="text-red-500">SEW</span>TEC<span className="ml-1 text-[9px] text-zinc-400">CRM</span>
            </div>
            <p className="mt-0.5 text-[10px] text-zinc-400">تكنولوجيا الخياطة • فرع المحلة</p>
          </div>
        </Link>
      </div>

      <div className="sidebar-expanded mx-5 mb-6 rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-1 text-[10px] text-zinc-400">مساحة العمل</p>
        <div className="flex items-center gap-2 text-xs font-medium">
          <MapPin size={14} className="text-red-400" />
          فرع المحلة الكبرى
          <span className="mr-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      <p className="sidebar-expanded px-6 pb-3 text-[10px] tracking-widest text-zinc-500">
        إدارة علاقات العملاء والمبيعات
      </p>

      <nav aria-label="التنقل الرئيسي" className="sidebar-nav">
        {navigation.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              title={label}
              className={cn("sidebar-link", active && "is-active")}
            >
              <Icon size={19} strokeWidth={1.7} className="shrink-0" />
              <span className="sidebar-label">{label}</span>
              {href === "/follow-ups" && counts.overdue > 0 && (
                <span className="sidebar-badge">{counts.overdue}</span>
              )}
              {active && <ArrowUpLeft size={14} className="sidebar-expanded mr-auto opacity-60" />}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}
          aria-expanded={!collapsed}
          className="flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white"
        >
          {collapsed ? (
            <PanelRightOpen size={17} />
          ) : (
            <>
              <PanelRightClose size={17} />
              <span>طي القائمة الجانبية</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
