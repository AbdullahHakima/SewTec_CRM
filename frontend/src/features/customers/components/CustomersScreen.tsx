"use client";
import dynamic from "next/dynamic";
import { ListStatus } from "@/components/ui/list-status";

import React, { useState } from "react";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { CustomerFilters } from "./CustomerFilters";
import { CustomerCards } from "./CustomerCards";
const CustomerTable = dynamic(() => import("./CustomerTable").then(module => module.CustomerTable));
const CustomerDrawer = dynamic(() => import("./CustomerDrawer").then(module => module.CustomerDrawer));
import { CustomerType } from "@/types/crm";
import { Plus, Users, LayoutGrid, List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
const FollowUpDrawer = dynamic(() => import("@/features/follow-ups/components/FollowUpDrawer").then(module => module.FollowUpDrawer));
const LogInteractionDrawer = dynamic(() => import("@/features/interactions/components/LogInteractionDrawer").then(module => module.LogInteractionDrawer));

export function CustomersScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<CustomerType | "all">("all");
  const [selectedRep, setSelectedRep] = useState("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [layout, setLayout] = useState<"table" | "cards">(() => searchParams.get("view") === "table" ? "table" : "cards");
  const [followUpCustomerId, setFollowUpCustomerId] = useState<string | null>(null);
  const [logCustomerId, setLogCustomerId] = useState<string | null>(null);

  const list = useCustomers({
    search,
    type: selectedType,
    assignedRepId: selectedRep,
    isStale: staleOnly,
  });
  const { customers } = list;

  const typeCounts = { all: list.summary.all, ...list.summary.typeCounts };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedType("all");
    setSelectedRep("all");
    setStaleOnly(false);
  };

  return (
    <div className="space-y-4">
      <ListStatus {...list} />
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">دليل العملاء</h1>
            <p className="text-xs text-slate-500">
              إدارة العملاء والمصانع ومتابعة بيانات التواصل
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-1 shadow-2xs" role="group" aria-label="طريقة عرض العملاء">
            <button aria-label="عرض جدول" aria-pressed={layout === "table"} onClick={() => setLayout("table")} className={`rounded-lg p-2 transition ${layout === "table" ? "bg-primary text-white" : "text-zinc-400 hover:bg-stone-100"}`}><List size={16} /></button>
            <button aria-label="عرض بطاقات" aria-pressed={layout === "cards"} onClick={() => setLayout("cards")} className={`rounded-lg p-2 transition ${layout === "cards" ? "bg-primary text-white" : "text-zinc-400 hover:bg-stone-100"}`}><LayoutGrid size={16} /></button>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-red-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <CustomerFilters
        search={search}
        onSearchChange={setSearch}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedRep={selectedRep}
        onRepChange={setSelectedRep}
        staleOnly={staleOnly}
        onStaleOnlyChange={setStaleOnly}
        typeCounts={typeCounts}
      />

      {/* Keep an initial load distinct from a valid empty result. */}
      {list.isLoading && customers.length === 0 ? (
        <div role="status" aria-label="جاري تحميل قائمة العملاء" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(key => <Skeleton key={key} className="h-52 rounded-2xl bg-stone-200/70 dark:bg-stone-800" />)}
        </div>
      ) : (
        <>
          {layout === "table" && <div className="hidden md:block">
            <CustomerTable
              customers={customers}
              onAddFollowUp={(c) => setFollowUpCustomerId(c.id)}
              onLogInteraction={(c) => setLogCustomerId(c.id)}
              onAddNewCustomer={() => setDrawerOpen(true)}
              onResetFilters={handleResetFilters}
            />
          </div>}
          <div className={layout === "table" ? "md:hidden" : "block"}>
            <CustomerCards
              customers={customers}
              onAddFollowUp={(customer) => setFollowUpCustomerId(customer.id)}
              onAddNewCustomer={() => setDrawerOpen(true)}
              onResetFilters={handleResetFilters}
            />
          </div>
        </>
      )}

      {/* Quick Customer Drawer */}
      {followUpCustomerId && <FollowUpDrawer open defaultCustomerId={followUpCustomerId} onClose={() => setFollowUpCustomerId(null)} />}
      {logCustomerId && <LogInteractionDrawer open defaultCustomerId={logCustomerId} onClose={() => setLogCustomerId(null)} />}
      {drawerOpen && <CustomerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCustomerCreated={(newId) => router.push(`/customers/${newId}`)}
      />}
    </div>
  );
}
