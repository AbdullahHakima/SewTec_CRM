"use client";

import React, { useState } from "react";
import { X, ChevronDown, ChevronUp, UserPlus, Check } from "lucide-react";
import { CustomerType } from "@/types/crm";
import { customerRepository } from "@/infrastructure/local-storage/local-storage-customer.repository";

interface CustomerDrawerProps {
  open: boolean;
  onClose: () => void;
  onCustomerCreated?: (customerId: string) => void;
}

export function CustomerDrawer({
  open,
  onClose,
  onCustomerCreated,
}: CustomerDrawerProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomerType>("factory");
  const [phone, setPhone] = useState("");
  const [assignedRepId, setAssignedRepId] = useState("rep_01");

  // Optional fields
  const [showOptional, setShowOptional] = useState(false);
  const [contactPerson, setContactPerson] = useState("");
  const [phoneSecondary, setPhoneSecondary] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("يرجى ملء اسم العميل ورقم الهاتف الأساسي");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const repName =
        assignedRepId === "rep_01" ? "أحمد شحاتة" : "محمد السيد";
      const created = await customerRepository.create({
        name: name.trim(),
        type,
        phone: phone.trim(),
        phoneSecondary: phoneSecondary.trim() || undefined,
        contactPerson: contactPerson.trim() || undefined,
        address: address.trim() || undefined,
        city: "المحلة الكبرى",
        assignedRepId,
        assignedRepName: repName,
        notes: notes.trim() || undefined,
      });

      // Reset form
      setName("");
      setPhone("");
      setContactPerson("");
      setPhoneSecondary("");
      setAddress("");
      setNotes("");
      setShowOptional(false);

      if (onCustomerCreated) {
        onCustomerCreated(created.id);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء حفظ بيانات العميل");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-r border-slate-200 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900">
                إضافة عميل جديد
              </h2>
              <p className="text-xs text-slate-500">
                تسجيل سريع في 20 ثانية لفرع المحلة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="customer-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {error && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Mandatory Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                اسم العميل أو المنشأة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: مصنع الأمل للملابس الجاهزة"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نوع العميل <span className="text-rose-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as CustomerType)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="factory">مصنع ملابس</option>
                  <option value="workshop">مشغل / ورشة</option>
                  <option value="trader">تاجر ماكينات</option>
                  <option value="individual">ترزي / فرد</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المسؤول بالفرع <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignedRepId}
                  onChange={(e) => setAssignedRepId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
                >
                  <option value="rep_01">أحمد شحاتة</option>
                  <option value="rep_02">محمد السيد</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف الأساسي <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                dir="ltr"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 text-left font-mono focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Expandable Optional Fields */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="flex items-center justify-between w-full py-2 text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              <span>بيانات إضافية واختيارية (جهة الاتصال، العنوان، الملاحظات)</span>
              {showOptional ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showOptional && (
              <div className="space-y-3 pt-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    اسم جهة الاتصال / المدير المسؤول
                  </label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="مثال: الحاج محمود الشناوي"
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    هاتف إضافي
                  </label>
                  <input
                    type="text"
                    value={phoneSecondary}
                    onChange={(e) => setPhoneSecondary(e.target.value)}
                    placeholder="040-0000000"
                    dir="ltr"
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 text-left font-mono focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    العنوان والمنطقة بالمحلة
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="المنطقة الصناعية، طريق المنصورة"
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    ملاحظات افتتاحية
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="الاهتمام الحالي، حجم خط الإنتاج، متطلبات خاصة..."
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            إلغاء
          </button>
          <button
            form="customer-form"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-[#0f2744] text-xs font-bold text-white hover:bg-[#19406b] transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{isSubmitting ? "جاري الحفظ..." : "حفظ العميل"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
