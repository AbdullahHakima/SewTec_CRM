"use client";
import { useState } from "react";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { apiClient } from "@/infrastructure/http/api-client";
import { UserRecord } from "./RolesTab";
export function EditUserDialog({user, onClose, onSaved}: {user: UserRecord; onClose: () => void; onSaved: () => void}) {
  const [fullName,setName]=useState(user.fullName); const [role,setRole]=useState(user.role);
  const [password,setPassword]=useState(""); const [active,setActive]=useState(user.isActive !== false);
  const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (saving) return; setSaving(true); setError("");
    try { await apiClient.put(`/users/${user.id}`, {fullName,role,password:password || undefined,isActive:active}); onSaved(); onClose(); }
    catch(error) { setError(error instanceof Error ? error.message : "تعذر الحفظ."); } finally { setSaving(false); }
  };
  return <ModalOverlay label="تعديل المستخدم" onClose={onClose} className="flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-md rounded-xl bg-white p-5 dark:bg-stone-900">
    <div className="flex justify-between"><h2 className="font-bold">تعديل المستخدم</h2><button onClick={onClose} aria-label="إغلاق">×</button></div>
    {error && <p role="alert" className="py-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
    <form onSubmit={save} className="space-y-4 py-4">
      <label className="block text-sm">الاسم<input required value={fullName} onChange={e=>setName(e.target.value)} className="w-full rounded-lg border p-2" /></label>
      <label className="block text-sm">الدور<select value={role} onChange={e=>setRole(e.target.value)} className="w-full rounded-lg border p-2"><option value="rep">مندوب</option><option value="admin">مسؤول الفرع</option></select></label>
      <label className="block text-sm">كلمة مرور جديدة (اختياري)<input type="password" autoComplete="new-password" minLength={12} value={password} onChange={e=>setPassword(e.target.value)} className="w-full rounded-lg border p-2" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)} />الحساب نشط</label>
      <p className="text-sm text-slate-600 dark:text-stone-300">حفظ التعديلات ينهي الجلسات الحالية لهذا المستخدم.</p>
      <button disabled={saving} className="w-full rounded-lg bg-red-600 p-3 text-white">{saving ? 'جاري الحفظ…' : 'حفظ التغييرات'}</button>
    </form>
  </div></ModalOverlay>;
}
