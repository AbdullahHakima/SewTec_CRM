"use client";
import { useState } from "react";
import { Customer } from "@/types/crm";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { apiClient } from "@/infrastructure/http/api-client";
import { useDirectory } from "@/lib/auth/use-directory";
import { crmStore } from "@/lib/storage/crm-store";

export function EditCustomerDialog({customer, onClose}: {customer: Customer; onClose: () => void}) {
  const {user, people} = useDirectory();
  const [form, setForm] = useState({name: customer.name, phone: customer.phone, phoneSecondary: customer.phoneSecondary || "", contactPerson: customer.contactPerson || "", address: customer.address, city: customer.city, notes: customer.notes || "", assignedRepId: customer.assignedRepId, type: customer.type});
  const [machine, setMachine] = useState({model: "", quantity: 1, purchaseYear: new Date().getFullYear(), serialNumber: "", purchasedFromSewTec: true});
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const save = async (event: React.FormEvent, addMachine = false) => {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      if (addMachine) await apiClient.post(`/customers/${customer.id}/machines`, {...machine, revision: customer.revision});
      else await apiClient.put(`/customers/${customer.id}`, {...form, revision: customer.revision});
      await crmStore.refreshCustomer(customer.id); onClose();
    } catch (error) { setError(error instanceof Error ? error.message : "تعذر الحفظ."); } finally { setBusy(false); }
  };
  return <ModalOverlay label="تعديل بيانات العميل" onClose={onClose} className="flex justify-end bg-black/40">
    <div className="flex h-full w-full max-w-lg flex-col bg-white p-5 dark:bg-stone-900">
      <div className="flex items-center justify-between"><h2 className="font-bold">تعديل بيانات العميل</h2><button onClick={onClose} aria-label="إغلاق">×</button></div>
      {error && <p role="alert" className="my-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
      <div className="min-h-0 overflow-y-auto space-y-6 py-4">
        <form onSubmit={save} className="space-y-3">
          {([['name','اسم العميل'],['phone','الهاتف الأساسي'],['phoneSecondary','الهاتف الإضافي'],['contactPerson','الشخص المسؤول'],['address','العنوان'],['city','المدينة']] as const).map(([key,label]) => <label key={key} className="block text-sm">{label}<input required={key === 'name' || key === 'phone'} value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})} className="mt-1 w-full rounded-lg border p-2" /></label>)}
          <label className="block text-sm">ملاحظات<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="mt-1 w-full rounded-lg border p-2" /></label>
          {user?.role === 'admin' && <label className="block text-sm">المسؤول عن العميل<select value={form.assignedRepId} onChange={e=>setForm({...form,assignedRepId:e.target.value})} className="w-full rounded-lg border p-2">{people.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}</select></label>}
          <button disabled={busy} className="w-full rounded-lg bg-red-600 p-3 text-white">{busy ? 'جاري الحفظ…' : 'حفظ بيانات العميل'}</button>
        </form>
        <details className="border-t pt-4"><summary className="cursor-pointer py-2 font-semibold">إضافة ماكينة إلى أسطول العميل</summary>
          <form onSubmit={event=>save(event,true)} className="space-y-3 pt-3">
            <label className="block text-sm">الموديل<input required value={machine.model} onChange={e=>setMachine({...machine,model:e.target.value})} className="w-full rounded-lg border p-2" /></label>
            <label className="block text-sm">العدد<input type="number" required min="1" value={machine.quantity} onChange={e=>setMachine({...machine,quantity:Number(e.target.value)})} className="w-full rounded-lg border p-2" /></label>
            <label className="block text-sm">سنة الشراء<input type="number" required min="1900" max={new Date().getFullYear()+1} value={machine.purchaseYear} onChange={e=>setMachine({...machine,purchaseYear:Number(e.target.value)})} className="w-full rounded-lg border p-2" /></label>
            <label className="block text-sm">الرقم المسلسل<input value={machine.serialNumber} onChange={e=>setMachine({...machine,serialNumber:e.target.value})} className="w-full rounded-lg border p-2" /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={machine.purchasedFromSewTec} onChange={e=>setMachine({...machine,purchasedFromSewTec:e.target.checked})} />تم الشراء من SewTec</label>
            <button disabled={busy} className="w-full rounded-lg border p-3">حفظ الماكينة</button>
          </form>
        </details>
      </div>
    </div>
  </ModalOverlay>;
}
