"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "relative",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        button_previous: "absolute right-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md border border-stone-200 dark:border-stone-800 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer",
        button_next: "absolute left-1 size-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md border border-stone-200 dark:border-stone-800 flex items-center justify-center hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-slate-400 rounded-md w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2 justify-center",
        day: "size-9 p-0 font-normal rounded-md text-center text-sm focus-within:relative focus-within:z-20 transition-colors",
        day_button: "size-9 p-0 font-normal hover:bg-red-50 hover:text-red-700 dark:hover:bg-stone-800 rounded-md transition-colors flex items-center justify-center cursor-pointer",
        selected: "bg-red-600! text-white! hover:bg-red-700! focus:bg-red-700! font-bold",
        today: "bg-stone-100 text-stone-900 font-bold dark:bg-stone-800 dark:text-stone-100 ring-2 ring-red-500/80",
        outside: "text-slate-300 dark:text-stone-600 opacity-50",
        disabled: "text-slate-300 opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
