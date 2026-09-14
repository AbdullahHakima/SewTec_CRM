"use client";

import React, { useState } from "react";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { apiClient } from "@/infrastructure/http/api-client";
import { UserRecord } from "./RolesTab";
import { Trash2, AlertTriangle, UserCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteUserDialogProps {
  user: UserRecord;
  availableUsers: UserRecord[];
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteUserDialog({
  user,
  availableUsers,
  onClose,
  onDeleted,
}: DeleteUserDialogProps) {
  const [reassignToUserId, setReassignToUserId] = useState<string>(
    availableUsers.find((u) => u.id !== user.id && u.isActive !== false)?.id || ""
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const hasWork =
    (user.assignedCustomersCount || 0) > 0 ||
    (user.scheduledFollowUpsCount || 0) > 0 ||
    (user.activePipelineValue || 0) > 0;

  const candidateUsers = availableUsers.filter(
    (u) => u.id !== user.id && u.isActive !== false
  );

  const handleDelete = async () => {
    if (submitting) return;
    if (hasWork && !reassignToUserId) {
      setError("يرجى اختيار المندوب البديل لنقل الأعمال إليه قبل الحذف.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const query = hasWork ? `?reassignToUserId=${reassignToUserId}` : "";
      await apiClient.delete(`/users/${user.id}${query}`);
      onDeleted();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر حذف المستخدم. تحقق من الصلاحيات وأعد المحاولة."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      await apiClient.put(`/users/${user.id}`, {
        isActive: false,
      });
      onDeleted();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر تعطيل الحساب. أعد المحاولة لاحقاً."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalOverlay
      label={`حذف المستخدم ${user.fullName}`}
      onClose={onClose}
      className="flex items-center justify-center bg-black/50 p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-right space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-stone-100">
                حذف حساب مستخدم
              </h2>
              <p className="text-xs text-slate-500 dark:text-stone-400">
                {user.fullName} ({user.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-lg font-bold p-1"
          >
            ×
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300 font-medium"
          >
            {error}
          </div>
        )}

        {hasWork ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3.5 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200 dark:border-amber-900/40">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <p className="font-bold">المستخدم لديه سجلات وأعمال مرتبطة:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  {user.assignedCustomersCount > 0 && (
                    <li>{user.assignedCustomersCount} عملاء مسندين حالياً</li>
                  )}
                  {user.scheduledFollowUpsCount > 0 && (
                    <li>{user.scheduledFollowUpsCount} متابعات مجدولة</li>
                  )}
                  {user.activePipelineValue > 0 && (
                    <li>
                      فرص بيعية بقيمة {user.activePipelineValue.toLocaleString()}{" "}
                      ج.م
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300">
                إعادة توزيع كافة العملاء والفرص إلى:
              </label>
              {candidateUsers.length > 0 ? (
                <select
                  value={reassignToUserId}
                  onChange={(e) => setReassignToUserId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs font-medium dark:border-stone-700 dark:bg-stone-800 text-slate-900 dark:text-stone-100"
                >
                  {candidateUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} (
                      {u.role === "admin" ? "مدير النظام" : "مندوب مبيعات"})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-red-600">
                  لا يوجد مستخدم نشط آخر لإعادة التوزيع إليه. يرجى إضافة مندوب أو
                  تعطيل الحساب فقط.
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Button
                type="button"
                onClick={handleDelete}
                disabled={submitting || candidateUsers.length === 0}
                className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20"
              >
                {submitting
                  ? "جاري الحذف وإعادة التوزيع…"
                  : "تأكيد الحذف وإعادة التوزيع"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDeactivate}
                disabled={submitting}
                className="w-full h-10 rounded-xl border-stone-200 dark:border-stone-700 text-xs font-bold"
              >
                <ShieldAlert className="h-4 w-4 ml-1 text-amber-600" />
                تعطيل الحساب فقط (موصى به - الحفاظ على التاريخ)
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-stone-300 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف المستخدم{" "}
              <strong className="text-slate-900 dark:text-white">
                "{user.fullName}"
              </strong>{" "}
              نهائياً؟ هذا الحساب لا يحتوي على أعمال أو عملاء مسندين حالياً.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl text-xs"
              >
                إلغاء
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                {submitting ? "جاري الحذف…" : "تأكيد الحذف"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
}
