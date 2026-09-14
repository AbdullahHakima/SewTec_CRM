"use client";
import { useAuth } from "@/lib/auth/auth-context";
export function BranchTab() {
 const {user} = useAuth();
 return <section className="space-y-4 rounded-xl border p-5"><h2 className="font-bold">بيانات الفرع</h2><dl className="grid grid-cols-2 gap-4 text-sm"><dt>الفرع</dt><dd>{user?.branchId}</dd><dt>التوقيت</dt><dd>Africa/Cairo</dd><dt>الصلاحية</dt><dd>{user?.role === "admin" ? "مسؤول الفرع" : "مندوب"}</dd></dl><p className="text-sm text-slate-600 dark:text-stone-300">يتولى مسؤول تشغيل النظام النسخ الاحتياطي والاستعادة.</p></section>;
}
