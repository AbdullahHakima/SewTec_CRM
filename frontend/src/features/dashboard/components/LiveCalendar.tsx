"use client";

import React, { useState, useEffect } from "react";
import { format, isSameDay } from "date-fns";
import { arEG } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock, ChevronDown, ArrowLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { FollowUp } from "@/types/crm";
import { formatBranchDate } from "@/lib/dates/branch-time";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface LiveCalendarProps {
  followUps?: FollowUp[];
}

export function LiveCalendar({ followUps = [] }: LiveCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };

    updateClock();
    const timer = setInterval(updateClock, 1000 * 60);
    return () => clearInterval(timer);
  }, []);

  // Follow-ups on selected date
  const selectedDateFollowUps = followUps.filter((f) => {
    if (!selectedDate) return false;
    return isSameDay(new Date(f.scheduledAt), selectedDate);
  });

  const isSelectedToday = selectedDate ? isSameDay(selectedDate, new Date()) : true;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="التقويم المباشر والمتابعات"
          className="flex items-center gap-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3 py-1.5 text-xs text-slate-700 dark:text-stone-200 shadow-2xs hover:bg-stone-50 dark:hover:bg-stone-800 transition-all cursor-pointer group"
        >
          {/* Live pulsing green dot */}
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>

          <CalendarIcon className="h-4 w-4 text-red-600 group-hover:scale-105 transition-transform" />

          <div className="flex items-center gap-1.5 font-medium">
            <span className="font-bold text-slate-900 dark:text-stone-100">
              {formatBranchDate(new Date().toISOString())}
            </span>
            {currentTime && (
              <span className="text-[11px] text-slate-400 dark:text-stone-400 font-mono" dir="ltr">
                {currentTime}
              </span>
            )}
          </div>

          <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        dir="rtl"
        className="w-auto p-0 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-xl overflow-hidden"
      >
        <div className="p-3.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-xs text-slate-900 dark:text-stone-100">
              تقويم فرع المحلة الكبرى
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedDate(new Date())}
            className="text-[11px] font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            العودة لليوم
          </button>
        </div>

        {/* Shadcn Native Calendar */}
        <div className="p-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) setSelectedDate(date);
            }}
            locale={arEG}
            dir="rtl"
            className="rounded-xl border-0"
          />
        </div>

        {/* Selected Day Agenda Strip */}
        <div className="p-3.5 border-t border-stone-100 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-800/40 space-y-2 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700 dark:text-stone-200 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {selectedDate
                  ? format(selectedDate, "EEEE، d MMMM yyyy", { locale: arEG })
                  : "اختر يوماً"}
              </span>
            </span>

            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold border",
                selectedDateFollowUps.length > 0
                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300"
                  : "bg-stone-100 text-stone-600 border-stone-200 dark:bg-stone-800 dark:text-stone-400"
              )}
            >
              {selectedDateFollowUps.length}{" "}
              {selectedDateFollowUps.length === 1 ? "متابعة" : "متابعات"}
            </span>
          </div>

          {selectedDateFollowUps.length > 0 ? (
            <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1">
              {selectedDateFollowUps.slice(0, 3).map((fu) => (
                <div
                  key={fu.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 text-[11px]"
                >
                  <span className="font-medium text-slate-800 dark:text-stone-200 line-clamp-1">
                    {fu.customerName}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(fu.scheduledAt).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 py-1">
              {isSelectedToday
                ? "لا توجد متابعات إضافية مجدولة لهذا اليوم."
                : "لا توجد مهام متابعة مجدولة في هذا التاريخ."}
            </p>
          )}

          <div className="pt-1 flex items-center justify-end">
            <Link
              href={isSelectedToday ? "/follow-ups?view=today" : "/follow-ups"}
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <span>فتح جدول المتابعات</span>
              <ArrowLeft className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

