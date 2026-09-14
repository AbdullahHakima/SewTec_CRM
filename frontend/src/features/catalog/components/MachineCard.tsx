"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  ShieldCheck,
  Gauge,
  Scissors,
  Layers,
  Eye
} from "lucide-react";
import { Product } from "@/types/crm";
import { formatEgp } from "@/lib/currency/format-currency";

interface MachineCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onCreateOpportunity: (product: Product) => void;
}

export function MachineCard({
  product,
  onViewDetails,
  onCreateOpportunity,
}: MachineCardProps) {
  const [copied, setCopied] = useState(false);

  const getBrandStyle = (brand: string) => {
    switch (brand.toUpperCase()) {
      case "JACK":
        return {
          badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60",
          accent: "text-red-600",
        };
      case "JUKI":
        return {
          badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60",
          accent: "text-blue-600",
        };
      case "BROTHER":
        return {
          badge: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900/60",
          accent: "text-sky-600",
        };
      case "SIRUBA":
        return {
          badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60",
          accent: "text-amber-600",
        };
      case "HIKARI":
        return {
          badge: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/60",
          accent: "text-purple-600",
        };
      default:
        return {
          badge: "bg-slate-50 text-slate-700 border-slate-200",
          accent: "text-slate-700",
        };
    }
  };

  const getCategoryName = (cat: string) => {
    switch (cat) {
      case "single_needle":
        return "سنجر إبرة واحدة";
      case "overlock":
        return "أوفرلوك صناعي";
      case "interlock":
        return "أورليه وفلاتلوك";
      case "buttonhole":
        return "عراوي وزراير";
      case "special":
        return "ماكينة خاصة";
      default:
        return cat;
    }
  };

  const handleCopyQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = [
      `ماكينة: ${product.model} (${product.brand})`,
      `السعر المعتمد: ${formatEgp(product.suggestedPriceEgp)}`,
      `السرعة: ${product.speedRpm || 5000} غرزة/دقيقة | الإبرة: ${product.needleSystem || "DBx1"}`,
      `قص خيط: ${product.hasAutomaticTrimmer ? "أوتوماتيك" : "يدوي"} | رفع دواس: ${product.hasAutoFootLifter ? "أوتوماتيك" : "يدوي"}`,
      `ضمان: ${product.warrantyMonths || 24} شهر - SewTec فرع المحلة`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const brandStyle = getBrandStyle(product.brand);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200">
      {/* Top badges bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold font-mono uppercase tracking-wider ${brandStyle.badge}`}
            >
              {product.brand}
            </span>
            <span className="inline-flex items-center rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {getCategoryName(product.category)}
            </span>
          </div>

          {product.inStock !== false ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              جاهز للتسليم ({product.stockCount || 1})
            </span>
          ) : (
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
              تحت الطلب
            </span>
          )}
        </div>

        {/* Model Title */}
        <h3
          className="text-lg font-black font-mono tracking-tight text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors"
          dir="ltr"
        >
          {product.model}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2 min-h-[36px]">
          {product.descriptionArabic}
        </p>

        {/* Current Price Display */}
        <div className="my-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
              السعر الحالي المعتمد
            </div>
            <div className="text-[10px] text-slate-400">شامل الضريبة كاش</div>
          </div>
          <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatEgp(product.suggestedPriceEgp)}
          </div>
        </div>

        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mb-4 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <Gauge size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">
              السرعة: <strong className="font-mono text-slate-800 dark:text-slate-200">{product.speedRpm ? product.speedRpm.toLocaleString() : "5,000"}</strong> RPM
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Scissors size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">
              قص الخيط: <strong className="text-slate-800 dark:text-slate-200">{product.hasAutomaticTrimmer ? "أوتوماتيك" : "يدوي"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Layers size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">
              الإبرة: <strong className="font-mono text-slate-800 dark:text-slate-200" dir="ltr">{product.needleSystem || "DBx1"}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-indigo-500 shrink-0" />
            <span className="truncate">
              الضمان: <strong className="text-indigo-600 dark:text-indigo-400">{product.warrantyMonths || 24} شهر</strong>
            </span>
          </div>
        </div>

        {/* Top feature tags */}
        {product.features && product.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {product.features.slice(0, 2).map((feat, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 text-[10px] text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-full"
              >
                <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                <span className="truncate">{feat}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Action Buttons */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center gap-2">
        <button
          onClick={() => onViewDetails(product)}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 transition"
        >
          <Eye size={13} />
          التفاصيل
        </button>

        <button
          onClick={handleCopyQuote}
          title="نسخ ملخص السعر والمواصفات للواتساب"
          aria-label="نسخ ملخص السعر"
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition shrink-0"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>

        <button
          onClick={() => onCreateOpportunity(product)}
          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-red-600 hover:bg-red-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition shadow-red-600/10"
        >
          <TrendingUp size={13} />
          + صفقة
        </button>
      </div>
    </div>
  );
}

