"use client";

import React, { useState, useMemo } from "react";
import { useCustomers } from "@/features/customers/hooks/use-customers";
import { CustomerFilters } from "./CustomerFilters";
import { CustomerTable } from "./CustomerTable";
import { CustomerDrawer } from "./CustomerDrawer";
import { CustomerType } from "@/types/crm";
import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export function CustomersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<CustomerType | "all">("all");
  const [selectedRep, setSelectedRep] = useState("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { customers, totalCount } = useCustomers({
    search,
    type: selectedType,
    assignedRepId: selectedRep,
    isStale: staleOnly,
  });

  const allCustomers = useCustomers().customers;

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: allCustomers.length,
      factory: 0,
      workshop: 0,
      trader: 0,
      individual: 0,
    };
    allCustomers.forEach((c) => {
      counts[c.type] = (counts[c.type] || 0) + 1;
    });
    return counts;
  }, [allCustomers]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0f2744] text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">دليل العملاء</h1>
            <p className="text-xs text-slate-500">
              إدارة عملاء ومصانع المحلة الكبرى • إجمالي {totalCount} عميل مسجل
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-[#0f2744] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#19406b] transition-colors"
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

      {/* Main Customers Table */}
      <CustomerTable
        customers={customers}
        onAddFollowUp={(c) => router.push(`/customers/${c.id}?action=followup`)}
        onLogInteraction={(c) => router.push(`/customers/${c.id}?action=log`)}
      />

      {/* Quick Customer Drawer */}
      <CustomerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCustomerCreated={(newId) => router.push(`/customers/${newId}`)}
      />
    </div>
  );
}
