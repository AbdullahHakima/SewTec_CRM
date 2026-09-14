import type { Metadata } from "next";
import { Alexandria, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { AppShell } from "@/components/layout/AppShell";

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  variable: "--font-alexandria",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SewTec CRM — فرع المحلة الكبرى",
  description: "نظام إدارة علاقات العملاء والمبيعات — فرع المحلة الكبرى",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${alexandria.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
