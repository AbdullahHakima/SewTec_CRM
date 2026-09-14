"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Search, Plus, Bell, ChevronDown, PhoneCall, CalendarPlus, Sparkles, UserPlus, LogOut, Shield, User } from "lucide-react";
import Link from "next/link";
import { useFollowUps } from "@/features/follow-ups/hooks/use-follow-ups";
const GlobalSearchDialog = dynamic(() => import("./GlobalSearchDialog").then(module => module.GlobalSearchDialog));
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth/auth-context";

type QuickAction = "call" | "followup" | "opportunity" | "customer";
const actions = [
  { key: "customer", label: "إضافة عميل جديد", description: "ابدأ علاقة جديدة", icon: UserPlus },
  { key: "call", label: "تسجيل مكالمة / زيارة", description: "احفظ تفاصيل التواصل", icon: PhoneCall },
  { key: "followup", label: "جدولة متابعة جديدة", description: "حدّد خطوتك القادمة", icon: CalendarPlus },
  { key: "opportunity", label: "إنشاء فرصة بيعية", description: "من الاهتمام إلى البيع", icon: Sparkles },
] as const;

export function TopBar({ onQuickAction }: { onQuickAction?: (action: QuickAction) => void }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const selectedAction = useRef(false);
  const actionTrigger = useRef<HTMLButtonElement>(null);
  const { counts } = useFollowUps();
  const { user, logout } = useAuth();

  const userInitials = user?.fullName
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
    : "أش";

  const userRoleText = user?.role === "admin" ? "مدير النظام" : "مبيعات فرع المحلة";

  return (
    <>
      <header className="crm-topbar sticky top-0 z-20 flex w-full items-center justify-between border-b px-4 md:px-6">
        <div className="flex-1 max-w-lg">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3.5 py-2.5 text-right text-xs text-zinc-500 transition hover:border-stone-300 hover:bg-white dark:border-stone-800 dark:bg-stone-900/60 dark:text-zinc-400"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <Search size={16} className="shrink-0" />
              <span className="truncate">ابحث عن عميل، هاتف أو ماكينة...</span>
            </span>
            <kbd dir="ltr" className="hidden shrink-0 rounded-md border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] text-zinc-400 dark:border-stone-700 dark:bg-stone-800 sm:block">
              Ctrl K
            </kbd>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />

          {/* New Action Dropdown */}
          <DropdownMenu dir="rtl" modal={false} onOpenChange={(open) => { if (open) selectedAction.current = false; }}>
            <DropdownMenuTrigger asChild>
              <Button ref={actionTrigger} aria-label="إجراء جديد" className="h-10 rounded-xl px-4">
                <Plus size={16} />
                <span className="quick-action-label">إجراء جديد</span>
                <ChevronDown size={13} className="opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="w-64 rounded-2xl p-2 shadow-xl" onCloseAutoFocus={(event) => { if (selectedAction.current) event.preventDefault(); }}>
              <DropdownMenuLabel className="px-3 py-2 text-[11px] text-zinc-400">خطوتك التالية</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {actions.map(({ key, label, description, icon: Icon }) => (
                <DropdownMenuItem
                  key={key}
                  onSelect={() => {
                    selectedAction.current = true;
                    actionTrigger.current?.focus();
                    onQuickAction?.(key);
                  }}
                  className="gap-3 rounded-xl p-3"
                >
                  <span className="rounded-lg bg-red-50 p-2 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                    <Icon size={16} />
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] text-zinc-400">{description}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Overdue Notification Link */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/follow-ups?view=overdue" aria-label={`المتابعات المتأخرة: ${counts.overdue}`} className="relative rounded-xl p-2 text-zinc-500 transition hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-stone-800">
                <Bell size={20} strokeWidth={1.7} />
                {counts.overdue > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-stone-900">
                    {counts.overdue}
                  </span>
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={10}>المتابعات التي تحتاج انتباهك</TooltipContent>
          </Tooltip>

          {/* User Profile Summary with Logout Dropdown */}
          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="profile-summary flex items-center gap-3 border-r border-stone-200 pr-4 text-right transition hover:opacity-80 dark:border-stone-800"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-stone-100 text-sm font-bold text-zinc-700 dark:border-stone-700 dark:bg-stone-800 dark:text-zinc-200">
                  {userInitials}
                </span>
                <div className="hidden flex-col text-right sm:flex">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                    {user?.fullName || ""}
                  </span>
                  <span className="mt-0.5 text-[10px] text-zinc-400">
                    {userRoleText}
                  </span>
                </div>
                <ChevronDown size={13} className="opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-2xl p-2 shadow-xl">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex items-center gap-2">
                  {user?.role === "admin" ? <Shield size={14} className="text-emerald-500" /> : <User size={14} className="text-blue-500" />}
                  <span className="text-xs font-bold">{user?.fullName}</span>
                </div>
                <p className="mt-0.5 text-[10px] text-zinc-400">اسم المستخدم: {user?.username}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={logout}
                className="gap-2.5 rounded-xl p-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
              >
                <LogOut size={15} />
                <span>تسجيل الخروج</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {searchOpen && <GlobalSearchDialog open onOpenChange={setSearchOpen} />}
    </>
  );
}
