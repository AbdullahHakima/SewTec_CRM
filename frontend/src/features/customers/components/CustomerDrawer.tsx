"use client";
import { useDirectory } from "@/lib/auth/use-directory";
import { Input } from "@/components/ui/input";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { PhoneInput } from "@/components/ui/phone-input";

import React, { useState } from "react";
import { X, ChevronDown, ChevronUp, UserPlus, Check } from "lucide-react";
import { CustomerType } from "@/types/crm";
import { customerRepository } from "@/infrastructure/local-storage/local-storage-customer.repository";

function normalizePhone(value: string) {
 let digits = value.replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 1632)).replace(/\D/g, "");
 if (digits.startsWith("0020")) digits = digits.slice(4); else if (digits.startsWith("20") && digits.length >= 12) digits = digits.slice(2);
 return digits.length === 10 ? "0" + digits : digits;
}
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
  const { user: signedInUser, people } = useDirectory();
  const [name, setName] = useState("");
  const [type, setType] = useState<CustomerType>("factory");
  const [phone, setPhone] = useState("");
  const [assignedRepId, setAssignedRepId] = useState("");

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
    if (isSubmitting) return;
    if (!name.trim() || !phone.trim()) {
      setError("يرجى ملء اسم العميل ورقم الهاتف الأساسي");
      return;
    }

    const cleanDigits = normalizePhone(phone);
    if (cleanDigits.length !== 11) {
      setError("رقم الهاتف الأساسي يجب أن يتكون من 11 رقماً بالضبط (مثال: 01012345678)");
      return;
    }

    if (phoneSecondary.trim()) {
      const secDigits = normalizePhone(phoneSecondary);
      if (secDigits.length !== 11) {
        setError("رقم الهاتف الإضافي يجب أن يتكون من 11 رقماً بالضبط");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");

    try {
      const repName = people.find(person => person.id === assignedRepId)?.fullName || signedInUser?.fullName || "";
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
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ بيانات العميل");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay label="إضافة عميل جديد" onClose={onClose} className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-r border-slate-200 animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
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
            aria-label="إغلاق"
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
              <label htmlFor="customerdrawer-field-1" className="block text-xs font-bold text-slate-700 mb-1">
                اسم العميل أو المنشأة <span className="text-rose-500">*</span>
              </label>
              <Input id="customerdrawer-field-1"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: مصنع الأمل للملابس الجاهزة"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="customerdrawer-field-2" className="block text-xs font-bold text-slate-700 mb-1">
                  نوع العميل <span className="text-rose-500">*</span>
                </label>
                <select id="customerdrawer-field-2"
                  value={type}
                  onChange={(e) => setType(e.target.value as CustomerType)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
                >
                  <option value="factory">مصنع ملابس</option>
                  <option value="workshop">مشغل / ورشة</option>
                  <option value="trader">تاجر ماكينات</option>
                  <option value="individual">ترزي / فرد</option>
                </select>
              </div>

              <div>
                <label htmlFor="customerdrawer-field-3" className="block text-xs font-bold text-slate-700 mb-1">
                  المسؤول بالفرع <span className="text-rose-500">*</span>
                </label>
                <select id="customerdrawer-field-3"
                  value={assignedRepId}
                  onChange={(e) => setAssignedRepId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
                >
                  <option value="">المستخدم الحالي</option>{people.map(person => <option key={person.id} value={person.id}>{person.fullName}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="customerdrawer-field-4" className="block text-xs font-bold text-slate-700 mb-1">
                رقم الهاتف الأساسي <span className="text-rose-500">*</span>
              </label>
              <PhoneInput
                id="customerdrawer-field-4"
                value={phone}
                onChange={setPhone}
                required
                showActions={false}
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
                  <label htmlFor="customerdrawer-field-5" className="block text-xs font-medium text-slate-600 mb-1">
                    اسم جهة الاتصال / المدير المسؤول
                  </label>
                  <Input id="customerdrawer-field-5"
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="مثال: الحاج محمود الشناوي"
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="customerdrawer-field-6" className="block text-xs font-medium text-slate-600 mb-1">
                    هاتف إضافي
                  </label>
                  <PhoneInput
                    id="customerdrawer-field-6"
                    value={phoneSecondary}
                    onChange={setPhoneSecondary}
                    placeholder="01512345678"
                    showActions={false}
                  />
                </div>

                <div>
                  <label htmlFor="customerdrawer-field-7" className="block text-xs font-medium text-slate-600 mb-1">
                    العنوان والمنطقة بالمحلة
                  </label>
                  <Input id="customerdrawer-field-7"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="المنطقة الصناعية، طريق المنصورة"
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="customerdrawer-field-8" className="block text-xs font-medium text-slate-600 mb-1">
                    ملاحظات افتتاحية
                  </label>
                  <textarea id="customerdrawer-field-8"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="الاهتمام الحالي، حجم خط الإنتاج، متطلبات خاصة..."
                    className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-red-500 focus:outline-hidden"
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
            aria-label="إغلاق"
            className="px-4 py-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            إلغاء
          </button>
          <button
            form="customer-form"
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 rounded-md bg-primary text-xs font-bold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            <span>{isSubmitting ? "جاري الحفظ..." : "حفظ العميل"}</span>
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
