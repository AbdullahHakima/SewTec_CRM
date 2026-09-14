"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Native modal semantics provide focus containment, Escape, and an inert background. */
export function ModalOverlay({ children, className, label, onClose }: { children: ReactNode; className?: string; label: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return <dialog ref={ref} aria-label={label} className={cn("crm-modal", className)} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    {children}
  </dialog>;
}
