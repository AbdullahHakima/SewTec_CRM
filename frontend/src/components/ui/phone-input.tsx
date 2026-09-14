"use client";

import React, { useState } from "react";
import flags from "react-phone-number-input/flags";
import { Phone, Check, Copy, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  showActions?: boolean;
  label?: string;
  error?: string;
}

export function PhoneInput({
  value = "",
  onChange,
  placeholder = "01012345678",
  disabled,
  required,
  id,
  className,
  showActions = true,
  label,
  error,
}: PhoneInputProps) {
  const [copied, setCopied] = useState(false);

  // Extract digits only
  const digits = value.replace(/\D/g, "");
  const digitCount = digits.length;
  const isComplete = digitCount === 11;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and limit to 11 characters
    const rawValue = e.target.value;
    const cleanDigits = rawValue.replace(/\D/g, "").slice(0, 11);
    onChange?.(cleanDigits);
  };

  const cleanPhone = digits;
  const formattedForWhatsApp = cleanPhone.startsWith("0")
    ? "20" + cleanPhone.slice(1)
    : "20" + cleanPhone;

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className={cn("space-y-1.5 text-right", className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          <span
            className={cn(
              "text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded font-semibold",
              isComplete
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                : digitCount > 0
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                : "text-zinc-400"
            )}
          >
            {isComplete ? "✓ 11 رقماً (مكتمل)" : `${digitCount} / 11 رقماً`}
          </span>
        </div>
      )}

      <div className="relative flex items-center rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 transition-all focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20">
        {/* Egypt Country Badge */}
        <div
          className="flex items-center gap-1.5 border-l border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 rounded-r-xl select-none shrink-0"
          title="جمهورية مصر العربية (+20)"
        >
          <FlagComponent country="EG" countryName="جمهورية مصر العربية" />
          <span className="font-mono text-xs font-bold text-zinc-700 dark:text-zinc-200" dir="ltr">
            +20
          </span>
          <span className="text-[10px] font-semibold text-zinc-400">مصر</span>
        </div>

        {/* 11-digit restricted input */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={11}
          dir="ltr"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className="w-full bg-transparent px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-hidden font-mono tabular-nums text-left"
        />

        {/* Action icons (Copy, Call, WhatsApp) */}
        {showActions && value && (
          <div className="flex items-center gap-1 px-2 border-r border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={handleCopy}
              title={copied ? "تم النسخ" : "نسخ الرقم"}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
            <a
              href={`https://wa.me/${formattedForWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              title="محادثة واتساب"
              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
            >
              <MessageCircle size={14} />
            </a>
            <a
              href={`tel:${cleanPhone}`}
              title="اتصال هاتفي"
              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
            >
              <Phone size={14} />
            </a>
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
      ) : (
        <p className="text-[10px] text-zinc-400">
          يجب أن يتكون من 11 رقماً يبدأ بـ 01 (أورانج، فودافون، اتصالات، وي)
        </p>
      )}
    </div>
  );
}

function FlagComponent({ country, countryName }: { country: string; countryName: string }) {
  const Flag = flags[country as keyof typeof flags];
  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-xs bg-stone-100 shadow-2xs">
      {Flag && <Flag title={countryName} />}
    </span>
  );
}
