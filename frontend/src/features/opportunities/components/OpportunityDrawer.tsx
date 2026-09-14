"use client";
import { apiClient } from "@/infrastructure/http/api-client";
import { useDirectory } from "@/lib/auth/use-directory";
import { Input } from "@/components/ui/input";
import { ModalOverlay } from "@/components/ui/modal-overlay";

import React, { useState } from "react";
import { X, Sparkles, Check, Tag } from "lucide-react";
import { OpportunityStage } from "@/types/crm";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { opportunityRepository } from "@/infrastructure/local-storage/local-storage-opportunity.repository";
import { crmStore } from "@/lib/storage/crm-store";
import { formatEgp } from "@/lib/currency/format-currency";

interface OpportunityDrawerProps {
  open: boolean;
  onClose: () => void;
  defaultCustomerId?: string;
  defaultMachineModel?: string;
  defaultEstimatedValue?: number;
  onSuccess?: () => void;
}
export function OpportunityDrawer({
  open,
  onClose,
  defaultCustomerId,
  defaultMachineModel,
  defaultEstimatedValue,
  onSuccess,
}: OpportunityDrawerProps) {
  const { user: signedInUser, people } = useDirectory();
  const [customerSearch, setCustomerSearch] = useState("");
  const { customers } = useCustomers({ search: customerSearch });
  const catalogProducts = crmStore.getSnapshot().products || [];

  const initialModel = defaultMachineModel || (catalogProducts[0]?.model ?? "JACK A4B-A");
  const matchingProduct = catalogProducts.find((p) => p.model === initialModel);
  const initialValue = defaultEstimatedValue ?? (matchingProduct ? matchingProduct.suggestedPriceEgp : undefined);

  const [customerId, setCustomerId] = useState(defaultCustomerId || "");
  const [machineModel, setMachineModel] = useState(initialModel);
  const [quantity, setQuantity] = useState(1);
  const [estimatedValue, setEstimatedValue] = useState<number | undefined>(initialValue);
  const [stage, setStage] = useState<OpportunityStage>("new");
  const [assignedRepId, setAssignedRepId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync if default props change when opened
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      if (defaultCustomerId) setCustomerId(defaultCustomerId);
      if (defaultMachineModel) {
        setMachineModel(defaultMachineModel);
        const p = catalogProducts.find((x) => x.model === defaultMachineModel);
        if (defaultEstimatedValue) {
          setEstimatedValue(defaultEstimatedValue);
        } else if (p) {
          setEstimatedValue(p.suggestedPriceEgp * quantity);
        }
      }
    }
  }

  if (!open) return null;

  const currentProduct = catalogProducts.find((p) => p.model === machineModel);

  const handleMachineChange = (newModel: string) => {
    setMachineModel(newModel);
    const prod = catalogProducts.find((p) => p.model === newModel);
    if (prod) {
      setEstimatedValue(prod.suggestedPriceEgp * quantity);
    }
  };

  const handleQuantityChange = (newQty: number) => {
    const validQty = Math.max(1, newQty);
    setQuantity(validQty);
    if (currentProduct) {
      setEstimatedValue(currentProduct.suggestedPriceEgp * validQty);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !machineModel.trim()) {
      setError("يرجى اختيار العميل وتحديد نوع الماكينة");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const selectedCustomer = customers.find((c) => c.id === customerId) ?? await apiClient.get<import("@/types/crm").Customer>(`/customers/${customerId}`);
      if (!selectedCustomer) {
        throw new Error("Customer not found");
      }

      const repName = people.find(person => person.id === assignedRepId)?.fullName || signedInUser?.fullName || "";
      const title = `توريد ${quantity} ماكينة ${machineModel}`;

      await opportunityRepository.create({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        title,
        machineModel: machineModel.trim(),
        quantity,
        estimatedValue,
        stage,
        assignedRepId,
        assignedRepName: repName,
        notes: notes.trim() || undefined,
      });

      setNotes("");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء إنشاء الفرصة");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay label="إنشاء فرصة بيعية" onClose={onClose} className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-r border-slate-200 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                إنشاء فرصة بيعية جديدة
              </h2>
              <p className="text-xs text-slate-500">
                تسجيل اهتمام أو صفقة توريد لفرع المحلة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="create-opp-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4 text-xs"
        >
          {error && (
            <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label htmlFor="opportunitydrawer-field-1" className="block font-bold text-slate-700 mb-1">
              العميل <span className="text-rose-500">*</span>
            </label>
            <input aria-label="بحث عن عميل" placeholder="ابحث بالاسم أو رقم الهاتف" value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="mb-2 w-full rounded-lg border p-2" />
            <select id="opportunitydrawer-field-1"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
            >
              <option value="">اختر العميل...</option>
              {customerId && !customers.some(c => c.id === customerId) && <option value={customerId}>العميل المحدد</option>}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>

          {/* Machine and Quantity */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label htmlFor="opportunitydrawer-field-2" className="block font-bold text-slate-700 mb-1">
                موديل الماكينة (من الكتالوج) <span className="text-rose-500">*</span>
              </label>
              <select id="opportunitydrawer-field-2"
                value={machineModel}
                onChange={(e) => handleMachineChange(e.target.value)}
                className="w-full rounded-md border border-slate-300 p-2 text-xs font-mono font-bold text-slate-900 focus:border-red-500 focus:outline-hidden"
                dir="ltr"
              >
                {catalogProducts.map((p) => (
                  <option key={p.id} value={p.model}>
                    {p.brand} - {p.model} ({formatEgp(p.suggestedPriceEgp)})
                  </option>
                ))}
                <option value="Overlock 4-thread">Overlock 4-thread</option>
                <option value="أخرى">أخرى / موديل غير مدرج</option>
              </select>

              {currentProduct && (
                <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-700 font-medium bg-emerald-50/70 border border-emerald-100 px-2 py-1 rounded">
                  <span className="flex items-center gap-1">
                    <Tag size={11} />
                    سعر الوحدة بالكتالوج: {formatEgp(currentProduct.suggestedPriceEgp)}
                  </span>
                  {currentProduct.inStock !== false && (
                    <span className="text-[10px] text-emerald-600">متوفر بالمخزن</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="opportunitydrawer-field-3" className="block font-bold text-slate-700 mb-1">
                الكمية <span className="text-rose-500">*</span>
              </label>
              <Input id="opportunitydrawer-field-3"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                className="w-full rounded-md border border-slate-300 p-2 text-xs font-mono font-bold text-slate-900 focus:border-red-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Value and Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="opportunitydrawer-field-4" className="font-bold text-slate-700">
                  القيمة الإجمالية (ج.م)
                </label>
                {currentProduct && (
                  <button
                    type="button"
                    onClick={() => setEstimatedValue(currentProduct.suggestedPriceEgp * quantity)}
                    className="text-[10px] text-red-600 hover:underline"
                  >
                    إعادة ضبط للسعر
                  </button>
                )}
              </div>
              <Input id="opportunitydrawer-field-4"
                type="number"
                value={estimatedValue ?? ""}
                onChange={(e) =>
                  setEstimatedValue(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="اترك فارغاً إن لم تحدد"
                className="w-full rounded-md border border-slate-300 p-2 text-xs font-mono font-bold text-slate-900 focus:border-red-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="opportunitydrawer-field-5" className="block font-bold text-slate-700 mb-1">
                المرحلة المبدئية
              </label>
              <select id="opportunitydrawer-field-5"
                value={stage}
                onChange={(e) => setStage(e.target.value as OpportunityStage)}
                className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
              >
                <option value="new">جديد (New)</option>
                <option value="contacted">تم التواصل (Contacted)</option>
                <option value="interested">مهتم (Interested)</option>
                <option value="quotation">عرض سعر (Quotation)</option>
                <option value="negotiation">تفاوض (Negotiation)</option>
              </select>
            </div>
          </div>

          {/* Assigned Rep */}
          <div>
            <label htmlFor="opportunitydrawer-field-6" className="block font-bold text-slate-700 mb-1">
              المسؤول
            </label>
            <select id="opportunitydrawer-field-6"
              value={assignedRepId}
              onChange={(e) => setAssignedRepId(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
            >
              <option value="">المستخدم الحالي</option>{people.map(person => <option key={person.id} value={person.id}>{person.fullName}</option>)}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="opportunitydrawer-field-7" className="block font-bold text-slate-700 mb-1">
              ملاحظات وتفاصيل الصفقة
            </label>
            <textarea id="opportunitydrawer-field-7"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="احتياج العميل، شروط التسليم المطلوبة..."
              className="w-full rounded-md border border-slate-300 p-2 text-xs text-slate-900 focus:border-red-500 focus:outline-hidden"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="px-4 py-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            إلغاء
          </button>
          <button
            form="create-opp-form"
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-primary text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{submitting ? "جاري الإنشاء..." : "إنشاء الفرصة"}</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

