"use client";

import { useRef } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Button } from "./button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "./dropdown-menu";

export function ActionMenu({ label, actions }: { label: string; actions: { label: string; icon: LucideIcon; onSelect: () => void }[] }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = useRef(false);
  return <DropdownMenu dir="rtl" modal={false} onOpenChange={(open) => { if (open) selected.current = false; }}>
    <DropdownMenuTrigger asChild>
      <Button ref={trigger} variant="ghost" size="icon" aria-label={label} onClick={(event) => event.stopPropagation()} className="size-8 rounded-lg text-zinc-500"><MoreHorizontal size={16} /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl" onClick={(event) => event.stopPropagation()} onCloseAutoFocus={(event) => { if (selected.current) event.preventDefault(); }}>
      <DropdownMenuLabel className="truncate text-xs text-muted-foreground">{label}</DropdownMenuLabel>
      {actions.map(({ label: actionLabel, icon: Icon, onSelect }) => <DropdownMenuItem key={actionLabel} className="gap-3 rounded-xl p-3 text-xs" onSelect={() => { selected.current = true; trigger.current?.focus(); onSelect(); }}><Icon size={16} />{actionLabel}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}
