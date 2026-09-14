"use client";

import React from "react";
import { Search, X, RotateCcw } from "lucide-react";

export interface CatalogFilterState {
  search: string;
  brand: string;
  category: string;
  priceRange: string;
  availability: string;
  sortBy: string;
}

interface CatalogFiltersProps {
  filters: CatalogFilterState;
  onChange: (updated: CatalogFilterState) => void;
  onReset: () => void;
  availableBrands: string[];
}

export function CatalogFilters({
  filters,
  onChange,
  onReset,
  availableBrands,
}: CatalogFiltersProps) {
  const isFiltered =
    filters.search.trim() !== "" ||
    filters.brand !== "all" ||
    filters.category !== "all" ||
    filters.priceRange !== "all" ||
    filters.availability !== "all" ||
    filters.sortBy !== "default";

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs mb-6">
      {/* Search Bar + Quick Reset */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <div className="relative w-full flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="ابحث عن موديل، ماركة، مواصفة فنية (مثال: قص خيط، أوفرلوك، JUKI، شاشة لمس، DBx1)..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pr-10 pl-9 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-red-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-hidden transition"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: "" })}
              aria-label="مسح البحث"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {isFiltered && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition shrink-0"
          >
            <RotateCcw size={13} />
            إلغاء الفلاتر
          </button>
        )}
      </div>

      {/* Dropdown Menus Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Brand Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            ماركة الماكينة
          </label>
          <select aria-label="الماركة"
            value={filters.brand}
            onChange={(e) => onChange({ ...filters, brand: e.target.value })}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-red-500 focus:outline-hidden"
          >
            <option value="all">جميع الماركات ({availableBrands.length})</option>
            {availableBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            نوع الماكينة
          </label>
          <select aria-label="فئة الماكينة"
            value={filters.category}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-red-500 focus:outline-hidden"
          >
            <option value="all">جميع الأنواع</option>
            <option value="single_needle">سنجر إبرة واحدة (Single Needle)</option>
            <option value="overlock">أوفرلوك 4 و5 فتلة (Overlock)</option>
            <option value="interlock">أورليه وفلاتلوك (Interlock)</option>
            <option value="buttonhole">عراوي وزراير (Buttonhole)</option>
            <option value="special">ماكينات خاصة وثقيلة (Special)</option>
          </select>
        </div>

        {/* Price Range Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            فئة السعر الحالي
          </label>
          <select aria-label="نطاق السعر"
            value={filters.priceRange}
            onChange={(e) => onChange({ ...filters, priceRange: e.target.value })}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-red-500 focus:outline-hidden"
          >
            <option value="all">جميع فئات الأسعار</option>
            <option value="under_25k">أقل من 25,000 ج.م (اقتصادية)</option>
            <option value="25k_50k">25,000 - 50,000 ج.م (الأكثر طلباً)</option>
            <option value="50k_80k">50,000 - 80,000 ج.م (كمبيوتر متطور)</option>
            <option value="above_80k">أكثر من 80,000 ج.م (قمة التكنولوجيا)</option>
          </select>
        </div>

        {/* Availability Dropdown */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            جاهزية المخزن
          </label>
          <select aria-label="التوفر"
            value={filters.availability}
            onChange={(e) => onChange({ ...filters, availability: e.target.value })}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-red-500 focus:outline-hidden"
          >
            <option value="all">الكل (المتوفر وتحت الطلب)</option>
            <option value="in_stock">متوفر للتسليم الفوري بالمحلة</option>
            <option value="out_of_stock">تحت الطلب / استيراد</option>
          </select>
        </div>

        {/* Sort By Dropdown */}
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
            ترتيب النتائج
          </label>
          <select aria-label="ترتيب النتائج"
            value={filters.sortBy}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 focus:border-red-500 focus:outline-hidden"
          >
            <option value="default">الترتيب الافتراضي المعتمد</option>
            <option value="price_asc">السعر: من الأقل للأعلى</option>
            <option value="price_desc">السعر: من الأعلى للأقل</option>
            <option value="speed_desc">أقصى سرعة RPM: الأعلى أولاً</option>
            <option value="model_asc">اسم الموديل (A - Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

