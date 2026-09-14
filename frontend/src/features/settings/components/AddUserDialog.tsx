"use client";

import React, { useState } from "react";
import { ModalOverlay } from "@/components/ui/modal-overlay";
import { UserPlus, X, Check, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/infrastructure/http/api-client";

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserDialog({ open, onClose, onSuccess }: AddUserDialogProps) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("rep");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setError("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiClient.post("/users", {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        password,
        role,
        branchId: "mahalla",
      });

      setFullName("");
      setUsername("");
      setPassword("");
      setRole("rep");
      onSuccess();
      onClose();
    } catch (err) {
      setError((err instanceof Error ? err.message : "") || "فشل إنشاء المستخدم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay
      label="إضافة مستخدم جديد"
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden text-right dark:border-stone-800 dark:bg-stone-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50 dark:border-stone-800 dark:bg-stone-800/50">
          <div className="flex items-center gap-2 text-slate-800 dark:text-stone-100">
            <div className="p-1.5 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-lg">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-stone-100">
                إضافة مستخدم / مندوب جديد
              </h3>
              <p className="text-[11px] text-slate-500">
                إنشاء حساب لموظف بفرع المحلة الكبرى
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 dark:text-stone-300 mb-1">
              الاسم الكامل <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="مثال: يوسف غنيم"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-9 rounded-lg text-xs"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-stone-300 mb-1">
              اسم المستخدم (لتسجيل الدخول) <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              dir="ltr"
              placeholder="youssef"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-9 rounded-lg text-xs font-mono text-left"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-stone-300 mb-1">
              كلمة المرور <span className="text-rose-500">*</span>
            </label>
            <Input
              type="password"
              dir="ltr"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-9 rounded-lg text-xs text-left"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-stone-300 mb-1">
              الدور / الصلاحية <span className="text-rose-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-2 text-xs text-slate-900 dark:text-stone-100 focus:border-red-500 focus:outline-hidden"
            >
              <option value="rep">مندوب مبيعات (Sales Rep) — عملاء ومتابعات وصفقات</option>
              <option value="admin">مدير النظام (Admin) — صلاحيات إدارة وتحكم كاملة</option>
            </select>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-stone-800 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 text-xs font-medium"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-9 px-5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 size={14} className="animate-spin" />
                  جاري الحفظ...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check size={14} />
                  إنشاء الحساب
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
