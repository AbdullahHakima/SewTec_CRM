"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Layers,
  TrendingUp
} from "lucide-react";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { apiClient } from "@/infrastructure/http/api-client";
import { crmStore } from "@/lib/storage/crm-store";
import { formatEgp } from "@/lib/currency/format-currency";

interface ImportCatalogFileDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

interface ParsedPreviewRow {
  model: string;
  price?: number;
  brand?: string;
  category?: string;
  valid: boolean;
  notes?: string;
}

export function ImportCatalogFileDialog({
  open,
  onClose,
  onSuccess,
}: ImportCatalogFileDialogProps) {
  const [activeTab, setActiveTab] = useState<"prices" | "catalog">("prices");
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewRows, setFilePreviewRows] = useState<ParsedPreviewRow[]>([]);
  const [replaceAll, setReplaceAll] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [importResult, setImportResult] = useState<{
    success: boolean;
    total: number;
    updated: number;
    inserted?: number;
    notFound?: string[];
    errors?: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleReset = () => {
    setFile(null);
    setFilePreviewRows([]);
    setErrorMsg("");
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const parseFileForPreview = async (selectedFile: File) => {
    try {
      const text = await selectedFile.text();
      const isJson = selectedFile.name.endsWith(".json");
      const rows: ParsedPreviewRow[] = [];

      if (isJson) {
        let parsed = JSON.parse(text);
        if (Array.isArray(parsed.products)) parsed = parsed.products;
        else if (Array.isArray(parsed.prices)) parsed = parsed.prices;
        else if (Array.isArray(parsed.items)) parsed = parsed.items;

        if (Array.isArray(parsed)) {
          for (let i = 0; i < Math.min(parsed.length, 25); i++) {
            const item = parsed[i];
            const model = item.model || item.Model || item.id || item.Id || "";
            const price = Number(item.newPrice ?? item.NewPrice ?? item.suggestedPriceEgp ?? item.price ?? 0);
            rows.push({
              model: String(model),
              price: isNaN(price) ? 0 : price,
              brand: item.brand || item.Brand,
              category: item.category || item.Category,
              valid: Boolean(model) && price >= 0,
            });
          }
        }
      } else {
        // CSV Parsing Preview
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length > 1) {
          // Check up to first 25 data rows
          for (let i = 1; i < Math.min(lines.length, 26); i++) {
            const cells = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
            const model = cells[0] || "";
            // Find price in cell 1 or 3
            let rawPrice = activeTab === "prices" ? cells[1] : cells[3] || cells[1];
            if (rawPrice) {
              rawPrice = rawPrice.replace(/[^d.]/g, "");
            }
            const price = Number(rawPrice);
            rows.push({
              model,
              price: isNaN(price) ? 0 : price,
              brand: activeTab === "catalog" ? cells[1] : undefined,
              category: activeTab === "catalog" ? cells[2] : undefined,
              valid: Boolean(model) && !isNaN(price) && price >= 0,
            });
          }
        }
      }

      setFilePreviewRows(rows);
    } catch (err) {
      console.warn("Could not generate client-side preview", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    setImportResult(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith(".csv") && !selected.name.endsWith(".json")) {
      setErrorMsg("يرجى اختيار ملف بصيغة CSV أو JSON فقط.");
      return;
    }

    setFile(selected);
    parseFileForPreview(selected);
  };

  const handleDownloadTemplate = async (type: "prices" | "catalog") => {
    try {
      if (type === "prices") {
        await apiClient.downloadFile("/products/templates/prices-csv", "sewtec_prices_template.csv");
      } else {
        await apiClient.downloadFile("/products/templates/catalog-csv", "sewtec_catalog_template.csv");
      }
    } catch (err) {
      setErrorMsg("فشل تحميل النموذج: " + ((err instanceof Error ? err.message : "") || "خطأ غير متوقع"));
    }
  };

  const handleSubmitImport = async () => {
    if (!file) {
      setErrorMsg("يرجى اختيار ملف للاستيراد أولاً.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      if (activeTab === "prices") {
        const res = await apiClient.postFormData<{success: boolean; totalProcessed: number; updatedCount: number; insertedCount: number; notFoundModels: string[]; errors: string[]}>("/products/import-prices", formData);
        setImportResult({
          success: res.success,
          total: res.totalProcessed || 0,
          updated: res.updatedCount || 0,
          notFound: res.notFoundModels || [],
          errors: res.errors || [],
        });
        await crmStore.syncWithBackend();
        if (res.success) onSuccess(`تم تحديث أسعار ${res.updatedCount} ماكينة بنجاح!`);
      } else {
        const endpoint = replaceAll
          ? "/products/import-catalog?replaceAll=true"
          : "/products/import-catalog?replaceAll=false";
        const res = await apiClient.postFormData<{success: boolean; totalProcessed: number; updatedCount: number; insertedCount: number; notFoundModels: string[]; errors: string[]}>(endpoint, formData);
        setImportResult({
          success: res.success,
          total: res.totalProcessed || 0,
          updated: res.updatedCount || 0,
          inserted: res.insertedCount || 0,
          errors: res.errors || [],
        });
        await crmStore.syncWithBackend();
        if (res.success) onSuccess(
          replaceAll
            ? `تم إعادة استيراد الكتالوج بالكامل (${res.insertedCount} ماكينة جديدة)`
            : `تم تحديث ${res.updatedCount} وإضافة ${res.insertedCount} ماكينة جديدة!`
        );
      }
    } catch (err) {
      setErrorMsg((err instanceof Error ? err.message : "") || "حدث خطأ أثناء رفع ومعالجة الملف على الخادم.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ModalOverlay
      label="استيراد كتالوج الماكينات والأسعار من ملف"
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800"
        dir="rtl"
      >
        {/* Header */}
        <div className="relative border-b border-slate-100 dark:border-slate-800 p-6 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            onClick={onClose}
            className="absolute left-5 top-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-red-100 dark:bg-red-950/60 p-2.5 text-red-600 dark:text-red-400">
              <Upload size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                استيراد الكتالوج وقوائم الأسعار من ملف
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                يدعم ملفات Excel المصدّرة كـ CSV (UTF-8) وملفات JSON المهيكلة
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            <button
              onClick={() => {
                setActiveTab("prices");
                handleReset();
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === "prices"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <TrendingUp size={14} className="text-emerald-500" />
              تحديث قوائم الأسعار (Price Update)
            </button>
            <button
              onClick={() => {
                setActiveTab("catalog");
                handleReset();
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition ${
                activeTab === "catalog"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              <Layers size={14} className="text-indigo-500" />
              استيراد كتالوج كامل بمواصفاته (Full Catalog)
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span>
              {activeTab === "prices"
                ? "قم برفع ملف يحتوي على اسم الموديل والسعر الجديد لتحديث الأسعار في ثوانٍ."
                : "قم برفع ملف يحتوي على الموديل، الماركة، المواصفات والأسعار لإضافتها للكتالوج."}
            </span>
            <button
              onClick={() => handleDownloadTemplate(activeTab)}
              className="inline-flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400 hover:underline"
            >
              <Download size={13} />
              تحميل نموذج CSV جاهز
            </button>
          </div>
        </div>

        {/* Upload Body */}
        <div className="p-6 space-y-5">
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
              {file?.name.endsWith(".json") ? <FileText size={24} /> : <FileSpreadsheet size={24} />}
            </div>
            {file ? (
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{file.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  الحجم: {(file.size / 1024).toFixed(1)} كيلوبايت • انقر لاختيار ملف آخر
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  انقر هنا لاختيار ملف الكتالوج أو الأسعار
                </p>
                <p className="text-xs text-slate-400 mt-1">يدعم ملفات .CSV (Excel UTF-8) أو .JSON</p>
              </div>
            )}
          </div>

          {/* Full catalog replace all option */}
          {activeTab === "catalog" && (
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800/80">
              <input
                type="checkbox"
                checked={replaceAll}
                onChange={(e) => setReplaceAll(e.target.checked)}
                className="rounded text-red-600 focus:ring-red-500"
              />
              <span className="font-semibold text-amber-900 dark:text-amber-200">
                استبدال الكتالوج بالكامل (مسح كافة الموديلات الحالية ووضع ما في الملف فقط)
              </span>
            </label>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Live Preview Table */}
          {filePreviewRows.length > 0 && !importResult && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>معاينة محتويات الملف ({filePreviewRows.length} صف معروض):</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  تأكد من صحة أسماء الموديلات والأسعار
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                <table className="w-full text-right border-collapse">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 text-[11px] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">الموديل</th>
                      {activeTab === "catalog" && <th className="py-2 px-3">الماركة</th>}
                      <th className="py-2 px-3">السعر المقترح</th>
                      <th className="py-2 px-3">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filePreviewRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {row.model}
                        </td>
                        {activeTab === "catalog" && (
                          <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                            {row.brand || "—"}
                          </td>
                        )}
                        <td className="py-2 px-3 font-mono text-emerald-600 dark:text-emerald-400">
                          {row.price ? formatEgp(row.price) : "0 ج.م"}
                        </td>
                        <td className="py-2 px-3">
                          {row.valid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                              <CheckCircle2 size={11} /> صالح
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-500 font-semibold text-[10px]">
                              <AlertCircle size={11} /> بيانات ناقصة
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Result Summary */}
          {importResult && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                <CheckCircle2 size={16} />
                تم تنفيذ العملية بنجاح على الخادم!
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <div className="bg-white/80 dark:bg-slate-800 p-2 rounded-lg text-center">
                  <div className="text-slate-500 text-[10px]">إجمالي الصفوف</div>
                  <div className="font-mono font-black text-slate-900 dark:text-white">
                    {importResult.total}
                  </div>
                </div>
                <div className="bg-white/80 dark:bg-slate-800 p-2 rounded-lg text-center">
                  <div className="text-emerald-600 text-[10px]">تم تحديث سعره</div>
                  <div className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                    {importResult.updated}
                  </div>
                </div>
                {importResult.inserted !== undefined && (
                  <div className="bg-white/80 dark:bg-slate-800 p-2 rounded-lg text-center">
                    <div className="text-indigo-600 text-[10px]">ماكينات جديدة أضيفت</div>
                    <div className="font-mono font-black text-indigo-700 dark:text-indigo-300">
                      {importResult.inserted}
                    </div>
                  </div>
                )}
              </div>

              {importResult.notFound && importResult.notFound.length > 0 && (
                <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                  لم يتم العثور على الموديلات التالية بالكتالوج: {importResult.notFound.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            إغلاق
          </button>

          <div className="flex items-center gap-2">
            {file && !importResult && (
              <button
                onClick={handleReset}
                className="rounded-xl px-3 py-2 text-xs text-slate-500 hover:text-slate-700"
              >
                إلغاء الملف
              </button>
            )}

            <button
              onClick={handleSubmitImport}
              disabled={!file || isProcessing}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2 text-xs font-bold text-white shadow-md shadow-red-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              {isProcessing && <RefreshCw size={13} className="animate-spin" />}
              {isProcessing
                ? "جاري المعالجة والاستيراد..."
                : importResult
                ? "استيراد ملف آخر"
                : "تأكيد واستيراد الآن"}
            </button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}
