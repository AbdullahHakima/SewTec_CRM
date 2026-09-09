"use client";

import React, { useState } from "react";
import { InstalledMachine } from "@/types/crm";
import { Cpu } from "lucide-react";

interface MachineFleetPopoverProps {
  machines: InstalledMachine[];
}

export function MachineFleetPopover({ machines }: MachineFleetPopoverProps) {
  const [open, setOpen] = useState(false);

  if (!machines || machines.length === 0) {
    return <span className="text-slate-400 text-xs">لا توجد ماكينات مسجلة</span>;
  }

  const firstTwo = machines.slice(0, 2);
  const remainingCount = machines.length - 2;

  return (
    <div className="relative inline-block">
      <div
        className="flex items-center gap-1.5 cursor-pointer text-xs"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <div className="flex flex-wrap gap-1">
          {firstTwo.map((m, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-mono font-medium text-slate-700 border border-slate-200"
              dir="ltr"
            >
              <span>{m.model}</span>
              {m.quantity > 1 && (
                <span className="text-slate-400 font-sans">×{m.quantity}</span>
              )}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
              +{remainingCount}
            </span>
          )}
        </div>
      </div>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            className="absolute z-40 top-full mt-1.5 right-0 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl text-right animate-in fade-in zoom-in-95 duration-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                <Cpu className="h-3.5 w-3.5 text-blue-600" />
                <span>أسطول الماكينات المركبة ({machines.length})</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {machines.map((m, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-1.5 rounded bg-slate-50 text-xs border border-slate-100"
                >
                  <div>
                    <div className="font-mono font-bold text-slate-800" dir="ltr">
                      {m.model}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      شراء عام {m.purchaseYear}
                      {m.serialNumber && ` • الرقم: ${m.serialNumber}`}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-bold text-slate-700">
                      {m.quantity} ماكينات
                    </span>
                    {m.purchasedFromSewTec && (
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1 rounded">
                        توريد SewTec
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
