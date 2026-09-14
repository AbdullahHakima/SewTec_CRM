"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth/auth-context";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setLoading(true);
    setError("");

    const res = await login(username.trim(), password.trim());
    if (!res.success) {
      setError(res.error || "اسم المستخدم أو كلمة المرور غير صحيحة");
    }
    setLoading(false);
  };



  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-100/70 p-4 dark:bg-stone-950" dir="rtl">
      <div className="w-full max-w-md rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl dark:border-stone-800 dark:bg-stone-900 md:p-8">
        {/* Brand Header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-50 shadow-inner dark:bg-stone-800">
            <Image
              src="/images/sewtec-logo.png"
              alt="SewTec Logo"
              width={56}
              height={56}
              className="rounded-full"
            />
          </div>
          <div className="text-2xl font-black tracking-wider" dir="ltr">
            <span className="text-red-600">SEW</span>TEC
            <span className="ml-1 text-xs text-zinc-400 font-normal">CRM</span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            نظام إدارة المبيعات وعلاقات العملاء • فرع المحلة الكبرى
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              اسم المستخدم
            </label>
            <Input
              type="text"
              dir="ltr"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="h-11 rounded-xl text-left font-mono text-sm"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              كلمة المرور
            </label>
            <Input
              type="password"
              dir="ltr"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 rounded-xl text-left text-sm"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 w-full rounded-xl bg-red-600 text-sm font-bold text-white transition hover:bg-red-700"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                جاري تسجيل الدخول...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn size={16} />
                تسجيل الدخول
              </span>
            )}
          </Button>
        </form>

      </div>
    </div>
  );
}
