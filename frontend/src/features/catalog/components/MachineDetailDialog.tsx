"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  TrendingUp,
  ShieldCheck,
  Gauge,
  Sparkles,
  MapPin,
  Info,
  Edit3
} from "lucide-react";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { Product } from "@/types/crm";
import { formatEgp } from "@/lib/currency/format-currency";
import { crmStore } from "@/lib/storage/crm-store";
import { apiClient } from "@/infrastructure/http/api-client";
import { useAuth } from "@/lib/auth/auth-context";

interface MachineDetailDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onCreateOpportunity: (product: Product) => void;
}

export function MachineDetailDialog({
  product,
  open,
  onClose,
  onCreateOpportunity,
}: MachineDetailDialogProps) {
  const { user } = useAuth();
  const [priceError, setPriceError] = useState("");
  const [savedPrice, setSavedPrice] = useState<{id: string; value: number} | null>(null);
  const [copied, setCopied] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editPriceValue, setEditPriceValue] = useState(product?.suggestedPriceEgp ?? 0);
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  if (!open || !product) return null;

  const handleSavePrice = async () => {
    if (isSavingPrice || user?.role !== "admin") return;
    const val = Number(editPriceValue);
    if (isNaN(val) || val < 0) return;
    setIsSavingPrice(true);
    setPriceError("");
    try {
      await apiClient.put(`/products/${product.id}`, { suggestedPriceEgp: val });
      crmStore.update((draft) => {
        const p = draft.products.find((x) => x.id === product.id);
        if (p) p.suggestedPriceEgp = val;
      });

      setSavedPrice({id: product.id, value: val});
      setIsEditingPrice(false);
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : "تعذر حفظ السعر. حاول مرة أخرى.");
    } finally {
      setIsSavingPrice(false);
    }
  };

  const handleCopyQuote = () => {
    const text = [
      `شركة تكنولوجيا الخياطة (SewTec) - فرع المحلة الكبرى`,
      `عرض سعر رسمي لماكينة: ${product.model} (${product.brand})`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `السعر الحالي المعتمد: ${formatEgp(product.suggestedPriceEgp)}`,
      `حالة التوفر: ${product.inStock !== false ? `متوفر بالمخزن للتسليم الفوري (${product.stockCount || 1} ماكينة)` : "تحت الطلب"}`,
      `فترة الضمان: ${product.warrantyMonths || 24} شهراً شامل قطع الغيار والصيانة`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `المواصفات الفنية الأساسية:`,
      `• السرعة القصوى: ${product.speedRpm || 5000} غرزة/دقيقة`,
      `• أقصى طول غرزة: ${product.maxStitchLengthMm || 5} ملم`,
      `• نظام الإبرة: ${product.needleSystem || "DBx1"}`,
      `• المحرك: ${product.motorType || "سيرفو مدمج موفر للطاقة"}`,
      `• قص الخيط: ${product.hasAutomaticTrimmer ? "قص خيط أوتوماتيك فائق الدقة" : "يدوي"}`,
      `• رفع الدواس: ${product.hasAutoFootLifter ? "رفع دواس إلكتروني أوتوماتيك" : "يدوي / ركبة"}`,
      `• نظام التزييت: ${product.lubricationType || "تزييت أوتوماتيك مغلق"}`,
      `• الخامات المناسبة: ${product.application || "الأقمشة والملابس الجاهزة"}`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      `للتواصل والاستعلام: فرع المحلة الكبرى - 01000001122 / 01000002233`,
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "single_needle":
        return "سنجر إبرة واحدة (Single Needle)";
      case "overlock":
        return "أوفرلوك صناعي (Overlock)";
      case "interlock":
        return "أورليه وفلاتلوك (Interlock)";
      case "buttonhole":
        return "عراوي وزراير إلكترونية (Buttonhole)";
      case "special":
        return "ماكينات خاصة وثقيلة (Special)";
      default:
        return cat;
    }
  };

  const getBrandBadgeColor = (brand: string) => {
    switch (brand.toUpperCase()) {
      case "JACK":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800";
      case "JUKI":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800";
      case "BROTHER":
        return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800";
      case "SIRUBA":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
      case "HIKARI":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <ModalOverlay
      label={`تفاصيل الماكينة: ${product.model}`}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800"
        dir="rtl"
      >
        {/* Header with Title, Badges, and Price */}
        <div className="relative border-b border-slate-100 dark:border-slate-800 p-6 bg-radial from-slate-50 to-white dark:from-slate-800/40 dark:to-slate-900">
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="absolute left-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold font-mono uppercase tracking-wide ${getBrandBadgeColor(
                product.brand
              )}`}
            >
              {product.brand}
            </span>
            <span className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              {getCategoryLabel(product.category)}
            </span>
            {product.inStock !== false ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={12} />
                متوفر بالمخزن ({product.stockCount || 1} وحدة)
              </span>
            ) : (
              <span className="inline-flex items-center rounded-md border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                تحت الطلب
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-md border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
              <ShieldCheck size={12} />
              ضمان {product.warrantyMonths || 24} شهر
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mt-3">
            <div>
              <h2 className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white" dir="ltr">
                {product.model}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                كود الموديل بالكتالوج: <span className="font-mono text-slate-700 dark:text-slate-300">{product.id}</span>
              </p>
            </div>

            <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl px-4 py-2.5 text-left sm:text-right min-w-[200px]">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  السعر الحالي المعتمد
                </span>
                {!isEditingPrice && user?.role === "admin" && (
                  <button
                    onClick={() => {
                      setEditPriceValue(product.suggestedPriceEgp);
                      setIsEditingPrice(true);
                    }}
                    title="تعديل السعر"
                    className="text-[10px] inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                  >
                    <Edit3 size={11} />
                    تعديل
                  </button>
                )}
              </div>

              {isEditingPrice ? (
                <div className="mt-1 flex items-center gap-1.5">
                  <input
                    aria-label="السعر بالجنيه المصري"
                    type="number"
                    min="0"
                    step="500"
                    value={editPriceValue}
                    onChange={(e) => setEditPriceValue(Number(e.target.value))}
                    className="w-24 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-hidden"
                  />
                  <button
                    onClick={handleSavePrice}
                    disabled={isSavingPrice}
                    className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingPrice ? "حفظ..." : "حفظ"}
                  </button>
                  <button
                    onClick={() => setIsEditingPrice(false)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-50 cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatEgp(savedPrice?.id === product.id ? savedPrice.value : product.suggestedPriceEgp)}
                </div>
              )}

              {priceError && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{priceError}</p>}
              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
                سعر الكاش شامل الضريبة • فرع المحلة
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Info size={14} className="text-blue-500" />
              الوصف الفني والتشغيلي
            </h3>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              {product.descriptionArabic}
            </p>
          </div>

          {/* Technical Specifications Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Gauge size={14} className="text-indigo-500" />
              جدول المواصفات والبيانات الهندسية
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <table className="w-full text-right border-collapse">
                <tbody>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400 w-1/3">
                      السرعة القصوى
                    </td>
                    <td className="py-2.5 px-4 font-bold font-mono text-slate-900 dark:text-white">
                      {product.speedRpm ? `${product.speedRpm.toLocaleString()} غرزة / دقيقة` : "5,000 RPM"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                      أقصى طول للغرزة
                    </td>
                    <td className="py-2.5 px-4 font-bold font-mono text-slate-900 dark:text-white">
                      {product.maxStitchLengthMm ? `${product.maxStitchLengthMm} ملم` : "5.0 ملم"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                      نظام ومقاس الإبر المعتمد
                    </td>
                    <td className="py-2.5 px-4 font-bold font-mono text-slate-900 dark:text-white" dir="ltr">
                      {product.needleSystem || "DBx1 11-18#"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                      نوع وتقنية المحرك
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {product.motorType || "سيرفو مدمج مباشر (Direct Drive)"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                      قص الخيط الأوتوماتيكي
                    </td>
                    <td className="py-2.5 px-4">
                      {product.hasAutomaticTrimmer ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check size={14} /> متوفر أوتوماتيك فائق الدقة (خيط متبقي &lt; 3 ملم)
                        </span>
                      ) : (
                        <span className="text-slate-500">يدوي / غير متوفر بالموديل</span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                      رفع الدواس
                    </td>
                    <td className="py-2.5 px-4">
                      {product.hasAutoFootLifter ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check size={14} /> رفع دواس إلكتروني أوتوماتيك
                        </span>
                      ) : (
                        <span className="text-slate-500">ميكانيكي / بالركبة</span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                    <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                      نظام التزييت ومنع البقع
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 font-medium">
                      {product.lubricationType || "تزييت أوتوماتيك محكم"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                      الخامات والتطبيقات المناسبة
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                      {product.application || "الملابس الجاهزة والمنسوجات"}
                    </td>
                  </tr>
                  <tr className="bg-slate-50/40 dark:bg-slate-800/20">
                    <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                      الضمان وخدمات ما بعد البيع
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                      {product.warrantyMonths || 24} شهر ضمان معتمد من مركز صيانة SewTec بالمحلة
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Features List */}
          {product.features && product.features.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                المزايا والتقنيات الحصرية بالموديل
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 p-2.5 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin size={13} className="text-red-500" />
            فرع المحلة الكبرى • تسليم فوري وتجربة عملية قبل الشراء
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyQuote}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-500" />
                  تم نسخ كوتيشن العرض!
                </>
              ) : (
                <>
                  <Copy size={14} />
                  نسخ كوتيشن للواتساب
                </>
              )}
            </button>

            <button
              onClick={() => {
                onClose();
                onCreateOpportunity(product);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/20 transition"
            >
              <TrendingUp size={14} />
              + فتح صفقة بهذه الماكينة
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}

