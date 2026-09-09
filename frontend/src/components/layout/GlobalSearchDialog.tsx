"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Users, TrendingUp, Cpu, Phone } from "lucide-react";
import { crmStore } from "@/lib/storage/crm-store";
import { formatEgp } from "@/lib/currency/format-currency";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: GlobalSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const state = crmStore.getSnapshot();

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();

    const matchedCustomers = state.customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(q)) ||
        c.installedMachines.some((m) => m.model.toLowerCase().includes(q))
    );

    const matchedOpportunities = state.opportunities.filter(
      (op) =>
        op.title.toLowerCase().includes(q) ||
        op.customerName.toLowerCase().includes(q) ||
        op.machineModel.toLowerCase().includes(q)
    );

    const matchedProducts = state.products.filter(
      (p) =>
        p.model.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.descriptionArabic.toLowerCase().includes(q)
    );

    return {
      customers: matchedCustomers.slice(0, 4),
      opportunities: matchedOpportunities.slice(0, 3),
      products: matchedProducts.slice(0, 3),
      hasResults:
        matchedCustomers.length > 0 ||
        matchedOpportunities.length > 0 ||
        matchedProducts.length > 0,
    };
  }, [query, state]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl border border-slate-200">
        {/* Input Bar */}
        <div className="relative flex items-center border-b border-slate-200 px-4 py-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0 ml-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم العميل، الهاتف (010...)، أو كود الماكينة (HK2900)..."
            autoFocus
            className="flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 font-mono mr-2">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {!results ? (
            <div className="py-10 text-center text-slate-400 text-sm">
              <p className="font-medium text-slate-600">البحث السريع الموحد</p>
              <p className="text-xs text-slate-400 mt-1">
                اكتب للبحث الفوري في قاعدة عملاء المحلة والفرص والماكينات
              </p>
            </div>
          ) : !results.hasResults ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              لا توجد نتائج مطابقة لـ &quot;<span className="font-semibold text-slate-800">{query}</span>&quot;
            </div>
          ) : (
            <>
              {/* Customers Section */}
              {results.customers.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Users className="h-3.5 w-3.5 text-blue-600" />
                    <span>العملاء ({results.customers.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.customers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onOpenChange(false);
                          router.push(`/customers/${c.id}`);
                        }}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-right hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 group-hover:text-blue-600">
                              {c.name}
                            </span>
                            {c.isVip && (
                              <span className="text-amber-500 text-xs">⭐ VIP</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span className="font-mono text-left inline-block" dir="ltr">
                                {c.phone}
                              </span>
                            </span>
                            <span>•</span>
                            <span>{c.city}</span>
                            {c.contactPerson && (
                              <>
                                <span>•</span>
                                <span>{c.contactPerson}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-700 tabular-nums">
                          {formatEgp(c.lifetimeSales)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunities Section */}
              {results.opportunities.length > 0 && (
                <div className="border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                    <span>الفرص البيعية ({results.opportunities.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.opportunities.map((op) => (
                      <button
                        key={op.id}
                        onClick={() => {
                          onOpenChange(false);
                          router.push(`/opportunities`);
                        }}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-right hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 group-hover:text-blue-600">
                            {op.title}
                          </span>
                          <span className="text-xs text-slate-500 mt-0.5">
                            العميل: {op.customerName}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                          {formatEgp(op.estimatedValue)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Section */}
              {results.products.length > 0 && (
                <div className="border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <Cpu className="h-3.5 w-3.5 text-indigo-600" />
                    <span>كتالوج الماكينات ({results.products.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.products.map((p) => (
                      <div
                        key={p.id}
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2 text-right bg-slate-50/50"
                      >
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900" dir="ltr">
                              {p.model}
                            </span>
                            <span className="rounded bg-slate-200/70 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700">
                              {p.brand}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5 truncate max-w-md">
                            {p.descriptionArabic}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800 tabular-nums">
                          {formatEgp(p.suggestedPriceEgp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>التنقل بالأسهم • اضغط Enter للاختيار</span>
          <span>SewTec Fast Command</span>
        </div>
      </div>
    </div>
  );
}
