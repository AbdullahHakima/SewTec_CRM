"use client";

import React, {useState} from "react";
import { EditUserDialog } from "./EditUserDialog";
import { ShieldCheck, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface UserRecord {
  id: string;
  isActive?: boolean;
  username: string;
  fullName: string;
  role: string;
  branchId: string;
  createdAt: string;
  assignedCustomersCount: number;
  activePipelineValue: number;
  totalLifetimeSales: number;
  scheduledFollowUpsCount: number;
  overdueFollowUpsCount: number;
  completedFollowUpsCount: number;
  interactionsCount: number;
}

interface RolesTabProps {
  users: UserRecord[];
  onOpenAddUserDialog: () => void;
  onUserSaved: () => void;
  onDeleteUser: (user: UserRecord) => void;
}

export function RolesTab({ users, onOpenAddUserDialog, onDeleteUser, onUserSaved }: RolesTabProps) {
  const [editing,setEditing] = useState<UserRecord | null>(null);
  return (
    <div className="space-y-6">
      {editing && <EditUserDialog user={editing} onClose={()=>setEditing(null)} onSaved={onUserSaved} />}
      {/* User Management Header with Add User button */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-2xs space-y-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-red-600" />
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-stone-100">
                إدارة المستخدمين والأدوار الوظيفية
              </h2>
              <p className="text-[11px] text-slate-400">
                تحديد صلاحيات مناديب ومسؤولي فرع المحلة الكبرى
              </p>
            </div>
          </div>

          <Button
            onClick={onOpenAddUserDialog}
            className="h-9 gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20"
          >
            <Plus size={15} />
            <span>إضافة مستخدم جديد</span>
          </Button>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/80 text-slate-500 dark:text-stone-400 border-b border-stone-100 dark:border-stone-800">
              <tr>
                <th className="p-3 font-bold">الاسم الكامل</th>
                <th className="p-3 font-bold">اسم الدخول</th>
                <th className="p-3 font-bold">الدور الحالي</th>
                <th className="p-3 font-bold">الفرع</th>
                <th className="p-3 font-bold">الحالة</th>
                <th className="p-3 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-slate-800 dark:text-stone-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition">
                  <td className="p-3 font-bold text-slate-900 dark:text-stone-100 flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 font-bold text-[10px]">
                      {u.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <span>{u.fullName}</span>
                  </td>

                  <td className="p-3 font-mono text-slate-600 dark:text-stone-400 text-left" dir="ltr">
                    {u.username}
                  </td>

                  <td className="p-3">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                        u.role === "admin"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : u.role === "supervisor"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                      }`}
                    >
                      {u.role === "admin"
                        ? "مدير النظام (Admin)"
                        : u.role === "supervisor"
                        ? "مشرف مبيعات (Supervisor)"
                        : "مندوب مبيعات (Sales Rep)"}
                    </span>
                  </td>

                  <td className="p-3 text-slate-500">
                    {u.branchId === "mahalla" ? "فرع المحلة الكبرى" : u.branchId}
                  </td>

                  <td className="p-3">
                    {u.isActive !== false ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        نشط
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-stone-400 dark:text-stone-500 font-semibold text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                        معطل
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={()=>setEditing(u)}
                        className="rounded-lg border border-stone-200 dark:border-stone-700 px-2.5 py-1 text-xs hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUser(u)}
                        title="حذف المستخدم"
                        className="rounded-lg p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Permissions Matrix */}
      <section className="space-y-3 rounded-xl border p-5 text-sm">
        <h2 className="font-bold">الصلاحيات المعتمدة</h2>
        <p><strong>مسؤول الفرع:</strong> إدارة عملاء الفرع وفريقه، التوجيه والتقارير، وتحديث الكتالوج.</p>
        <p><strong>المندوب:</strong> إدارة العملاء المسندين إليه وفرصهم ومتابعاتهم وتواصلهم، واستعراض الكتالوج.</p>
      </section>
    </div>
  );
}
