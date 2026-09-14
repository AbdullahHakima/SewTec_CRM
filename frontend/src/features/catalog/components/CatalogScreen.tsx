"use client";
import { useAuth } from "@/lib/auth/auth-context";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Cpu,
  RefreshCw,
  Search,
  CheckCircle2,
  Upload,
  Download
} from "lucide-react";
import { Product } from "@/types/crm";
import { crmStore } from "@/lib/storage/crm-store";
import { apiClient } from "@/infrastructure/http/api-client";
import { useApiPage } from "@/infrastructure/http/use-api-page";
import { ListStatus } from "@/components/ui/list-status";
import { CatalogStats } from "./CatalogStats";
import { CatalogFilters, CatalogFilterState } from "./CatalogFilters";
import { MachineCard } from "./MachineCard";
import { MachineDetailDialog } from "./MachineDetailDialog";
import { ImportCatalogFileDialog } from "./ImportCatalogFileDialog";
import { OpportunityDrawer } from "@/features/opportunities/components/OpportunityDrawer";

export function CatalogScreen() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [selectedProductForOpportunity, setSelectedProductForOpportunity] = useState<Product | null>(null);
  const [isOpportunityDrawerOpen, setIsOpportunityDrawerOpen] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const [filters, setFilters] = useState<CatalogFilterState>({
    search: initialQuery,
    brand: "all",
    category: "all",
    priceRange: "all",
    availability: "all",
    sortBy: "default",
  });

  const urlQuery = searchParams.get("q") || "";
  const [previousUrlQuery, setPreviousUrlQuery] = useState(urlQuery);
  if (urlQuery !== previousUrlQuery) { setPreviousUrlQuery(urlQuery); setFilters(prev => ({...prev, search: urlQuery})); }

  // Sync with backend on demand
  const handleSyncWithBackend = async () => {
    setIsSyncing(true);
    try {
      const ok = await crmStore.syncWithBackend();
      if (ok) {
        list.retry();
        setSuccessToast("تمت مزامنة كتالوج الماكينات والأسعار الحالية من الخادم بنجاح");
      } else {
        setSuccessToast("تعذر تحديث البيانات. أعد المحاولة.");
      }
      setTimeout(() => setSuccessToast(""), 3500);
    } catch (error) { setSuccessToast(error instanceof Error ? error.message : "تعذر تحديث الكتالوج."); } finally {
      setIsSyncing(false);
    }
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      await apiClient.downloadFile("/products/export-csv", "sewtec_machines_catalog.csv");
      setSuccessToast("تم تصدير كتالوج الماكينات والأسعار الحالية بصيغة CSV بنجاح!");
      setTimeout(() => setSuccessToast(""), 3500);
    } catch (err) {
      setSuccessToast(err instanceof Error ? err.message : "تعذر تصدير الكتالوج. حاول مرة أخرى.");
    } finally {
      setIsExporting(false);
    }
  };

  const range = filters.priceRange === "under_25k" ? { maxPrice: 25000 }
    : filters.priceRange === "25k_50k" ? { minPrice: 25000, maxPrice: 50000 }
    : filters.priceRange === "50k_80k" ? { minPrice: 50000, maxPrice: 80000 }
    : filters.priceRange === "above_80k" ? { minPrice: 80000 } : {};
  const list = useApiPage<Product, { all: number; inStock: number; totalStockUnits: number; brands: string[]; minPrice: number; maxPrice: number }>("/products", {
    search: filters.search || undefined, brand: filters.brand, category: filters.category,
    inStock: filters.availability === "all" ? undefined : filters.availability === "in_stock",
    sortBy: filters.sortBy, ...range,
  }, { all: 0, inStock: 0, totalStockUnits: 0, brands: [], minPrice: 0, maxPrice: 0 });
  const filteredProducts = list.items;
  const availableBrands = list.summary.brands;

  const handleResetFilters = () => {
    setFilters({
      search: "",
      brand: "all",
      category: "all",
      priceRange: "all",
      availability: "all",
      sortBy: "default",
    });
  };

  const handleStartOpportunity = (product: Product) => {
    setSelectedProductForOpportunity(product);
    setIsOpportunityDrawerOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 md:p-8" dir="rtl">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-xl animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 size={16} />
          {successToast}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-red-50 dark:bg-red-950/60 p-2.5 text-red-600 dark:text-red-400">
              <Cpu size={22} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                كتالوج ماكينات الخياطة والأسعار
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                قاعدة بيانات الماكينات الصناعية، المواصفات الهندسية، والأسعار الحالية المعتمدة لفرع المحلة الكبرى
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user?.role === "admin" && <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/20 transition cursor-pointer"
          >
            <Upload size={14} />
            استيراد من ملف (أسعار / كتالوج)
          </button>}

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            <Download size={14} />
            {isExporting ? "جاري التصدير..." : "تصدير CSV"}
          </button>

          <button
            onClick={handleSyncWithBackend}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin text-red-600" : ""} />
            {isSyncing ? "جاري التحديث..." : "مزامنة الأسعار"}
          </button>
        </div>
      </div>

      {/* Live Statistics Cards */}
      <CatalogStats summary={list.summary} filteredCount={list.totalCount} />

      {/* Search and Dropdowns Filter Bar */}
      <CatalogFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        availableBrands={availableBrands}
      />
      <ListStatus {...list} />

      {/* Machines Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <MachineCard
              key={product.id}
              product={product}
              onViewDetails={(p) => setSelectedProductForDetail(p)}
              onCreateOpportunity={handleStartOpportunity}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Search size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            لا توجد ماكينات تطابق خيارات البحث الحالية
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            جرب تعديل كلمات البحث، أو تغيير الماركة، أو إعادة ضبط فئة السعر لعرض كافة الموديلات المتاحة.
          </p>
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
          >
            إعادة ضبط الفلاتر وعرض الكتالوج كاملاً
          </button>
        </div>
      )}

      {/* Machine Details Dialog Modal */}
      <MachineDetailDialog
        product={selectedProductForDetail}
        open={Boolean(selectedProductForDetail)}
        onClose={() => setSelectedProductForDetail(null)}
        onCreateOpportunity={(p) => {
          setSelectedProductForDetail(null);
          handleStartOpportunity(p);
        }}
      />

      {/* Import Catalog & Prices File Dialog Modal */}
      <ImportCatalogFileDialog
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={(msg) => {
          setIsImportModalOpen(false);
          setSuccessToast(msg);
          setTimeout(() => setSuccessToast(""), 4500);
        }}
      />

      {/* Opportunity Drawer with Preselected Machine & Calculated Value */}
      <OpportunityDrawer
        open={isOpportunityDrawerOpen}
        onClose={() => {
          setIsOpportunityDrawerOpen(false);
          setSelectedProductForOpportunity(null);
        }}
        defaultMachineModel={selectedProductForOpportunity?.model}
        defaultEstimatedValue={selectedProductForOpportunity?.suggestedPriceEgp}
        onSuccess={() => {
          setSuccessToast("تم إنشاء الفرصة البيعية وربطها بالماكينة بنجاح!");
          setTimeout(() => setSuccessToast(""), 3500);
        }}
      />
    </div>
  );
}

