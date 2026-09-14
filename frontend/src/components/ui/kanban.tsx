"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Kanban({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="kanban"
      className={cn("w-max min-w-full pb-2", className)}
      {...props}
    />
  )
}

interface KanbanColumnProps extends React.ComponentProps<"div"> {
  isOver?: boolean
}

function KanbanColumn({ className, isOver, ...props }: KanbanColumnProps) {
  return (
    <div
      data-slot="kanban-column"
      className={cn(
        "flex flex-col rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100/60 dark:bg-stone-900/50 p-3 min-w-[270px] w-full min-h-[540px] shadow-2xs space-y-3 transition-all duration-200",
        isOver && "border-primary ring-2 ring-primary/40 bg-red-50/20 dark:bg-red-950/20 scale-[1.01]",
        className
      )}
      {...props}
    />
  )
}

function KanbanColumnHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="kanban-column-header"
      className={cn("rounded-md p-2 flex items-center justify-between border border-slate-200/60 shadow-2xs", className)}
      {...props}
    />
  )
}

function KanbanColumnTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="kanban-column-title"
      className={cn("text-xs font-bold leading-none", className)}
      {...props}
    />
  )
}

function KanbanColumnContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="kanban-column-content"
      className={cn("space-y-2.5 flex-1 flex flex-col", className)}
      {...props}
    />
  )
}

interface KanbanCardProps extends React.ComponentProps<"div"> {
  isDragging?: boolean
}

function KanbanCard({ className, isDragging, ...props }: KanbanCardProps) {
  return (
    <div
      data-slot="kanban-card"
      className={cn(
        "group relative rounded-2xl border border-slate-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 shadow-2xs hover:border-red-300 hover:shadow-lg transition-all duration-200 space-y-3 text-right cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-40 scale-95 border-dashed border-primary ring-2 ring-primary/30 shadow-xl",
        className
      )}
      {...props}
    />
  )
}

function KanbanDropIndicator({ className, children, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="kanban-drop-indicator"
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-primary bg-primary/5 py-2.5 text-xs font-bold text-primary animate-pulse",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export {
  Kanban,
  KanbanColumn,
  KanbanColumnHeader,
  KanbanColumnTitle,
  KanbanColumnContent,
  KanbanCard,
  KanbanDropIndicator,
}
