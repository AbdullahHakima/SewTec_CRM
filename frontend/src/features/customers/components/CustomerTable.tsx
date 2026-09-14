"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Customer, CustomerType } from "@/types/crm";
import {
  Phone,
  MessageCircle,
  UserRound,
  CalendarPlus,
  AlertTriangle,
  Calendar,
  Star,
  SearchX,
  UserPlus,
  RotateCcw,
  Factory,
  Wrench,
  Store,
  User,
  MapPin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  TrendingUp,
} from "lucide-react";
import { formatEgp } from "@/lib/currency/format-currency";
import {
  formatBranchRelative,
  formatBranchDate,
  isOverdue,
  isCustomerStale,
  getDaysSinceContact,
} from "@/lib/dates/branch-time";
import { MachineFleetPopover } from "./MachineFleetPopover";
import { ActionMenu } from "@/components/ui/action-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CustomerTableProps {
  customers: Customer[];
  onLogInteraction?: (customer: Customer) => void;
  onAddFollowUp?: (customer: Customer) => void;
  onAddNewCustomer?: () => void;
  onResetFilters?: () => void;
}

type SortField = "name" | "type" | "lifetimeSales" | "lastContactAt" | "nextFollowUpAt";
type SortDirection = "asc" | "desc";

const customerTypeConfig: Record<
  CustomerType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badgeClass: string;
    iconClass: string;
    bgClass: string;
  }
> = {
  factory: {
    label: "مصنع",
    icon: Factory,
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
    iconClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-50/80 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40",
  },
  workshop: {
    label: "ورشة",
    icon: Wrench,
    badgeClass: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300",
    iconClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50/80 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40",
  },
  trader: {
    label: "تاجر",
    icon: Store,
    badgeClass: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
    iconClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40",
  },
  individual: {
    label: "فرد",
    icon: User,
    badgeClass: "border-stone-200 bg-stone-100 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300",
    iconClass: "text-stone-600 dark:text-stone-400",
    bgClass: "bg-stone-100/80 dark:bg-stone-800/40 border-stone-200/60 dark:border-stone-700/60",
  },
};

export function CustomerTable({
  customers,
  onLogInteraction,
  onAddFollowUp,
  onAddNewCustomer,
  onResetFilters,
}: CustomerTableProps) {
  const router = useRouter();

  // Sorting & Pagination state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection(
        field === "lifetimeSales" || field === "lastContactAt" || field === "nextFollowUpAt"
          ? "desc"
          : "asc"
      );
    }
  };

  const sortedCustomers = useMemo(() => {
    if (!sortField) return customers;

    return [...customers].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name, "ar");
          break;
        case "type":
          comparison = a.type.localeCompare(b.type, "ar");
          break;
        case "lifetimeSales":
          comparison = a.lifetimeSales - b.lifetimeSales;
          break;
        case "lastContactAt":
          comparison = new Date(a.lastContactAt).getTime() - new Date(b.lastContactAt).getTime();
          break;
        case "nextFollowUpAt": {
          const aTime = a.nextFollowUpAt ? new Date(a.nextFollowUpAt).getTime() : 0;
          const bTime = b.nextFollowUpAt ? new Date(b.nextFollowUpAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [customers, sortField, sortDirection]);

  const paginatedCustomers = sortedCustomers;

  // Statistics for the header bar
  const stats = useMemo(() => {
    const vipCount = customers.filter((c) => c.isVip).length;
    const staleCount = customers.filter((c) => isCustomerStale(c.lastContactAt, c.isVip)).length;
    const overdueCount = customers.filter((c) => isOverdue(c.nextFollowUpAt)).length;
    return { vipCount, staleCount, overdueCount };
  }, [customers]);

  const handlePhoneClick = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.open(`tel:${phone.replace(/[^0-9]/g, "")}`, "_self");
  };

  const handleWhatsAppClick = (e: React.MouseEvent, phone: string, name: string) => {
    e.stopPropagation();
    const cleanNumber = phone.replace(/[^0-9]/g, "");
    const egNumber = cleanNumber.startsWith("0") ? `2${cleanNumber}` : cleanNumber;
    const message = encodeURIComponent(`السلام عليكم أ. ${name}، بخصوص ماكينات SewTec للخياطة — فرع المحلة`);
    window.open(`https://wa.me/${egNumber}?text=${message}`, "_blank");
  };

  const handleCopyPhone = (e: React.MouseEvent, id: string, phone: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };



  if (customers.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        variant="search"
        badge="نتائج التصفية والبحث"
        title="لا يوجد عملاء مطابقين للبحث"
        description="لم يتم العثور على أي عميل يطابق معايير البحث أو التصنيف الحالية. يمكنك مسح التصفية أو تسجيل عميل جديد فوراً."
        action={onAddNewCustomer ? { label: "إضافة عميل جديد", onClick: onAddNewCustomer, icon: UserPlus } : undefined}
        secondaryAction={onResetFilters ? { label: "مسح الفلاتر والبحث", onClick: onResetFilters, icon: RotateCcw } : undefined}
      />
    );
  }

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-stone-400 opacity-60 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
    );
  };



  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-3">
        {/* Table Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              دليل العملاء ({customers.length})
            </span>
            {stats.vipCount > 0 && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 gap-1 text-[11px] py-0.5">
                <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                <span>{stats.vipCount} عملاء مميزين (VIP)</span>
              </Badge>
            )}
            {stats.overdueCount > 0 && (
              <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 gap-1 text-[11px] py-0.5">
                <AlertTriangle className="h-3 w-3 text-rose-500" />
                <span>{stats.overdueCount} متابعات متأخرة</span>
              </Badge>
            )}
          </div>

          {sortField && (
            <button
              onClick={() => {
                setSortField(null);
                setSortDirection("asc");
              }}
              className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>إعادة تعيين الترتيب</span>
            </button>
          )}
        </div>

        {/* Shadcn Table Card Container */}
        <ScrollArea dir="rtl" className="w-full rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-2xs">
          <Table dir="rtl" className="w-full min-w-[840px] text-right border-collapse" containerClassName="overflow-x-visible">
            <TableHeader>
              <TableRow className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/90 dark:bg-stone-800/80 hover:bg-stone-50/90 text-stone-700 dark:text-stone-200 font-bold text-xs">
                <TableHead className="py-3.5 px-4">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors group cursor-pointer"
                  >
                    <span>العميل</span>
                    {renderSortIcon("name")}
                  </button>
                </TableHead>
                <TableHead className="py-3.5 px-3">
                  <span>الهاتف والتواصل</span>
                </TableHead>
                <TableHead className="py-3.5 px-3">
                  <button
                    onClick={() => handleSort("type")}
                    className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors group cursor-pointer"
                  >
                    <span>النوع</span>
                    {renderSortIcon("type")}
                  </button>
                </TableHead>
                <TableHead className="py-3.5 px-3">
                  <span>الماكينات المركبة</span>
                </TableHead>
                <TableHead className="py-3.5 px-3">
                  <span>المسؤول</span>
                </TableHead>
                <TableHead className="py-3.5 px-3">
                  <button
                    onClick={() => handleSort("lastContactAt")}
                    className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors group cursor-pointer"
                  >
                    <span>آخر تواصل</span>
                    {renderSortIcon("lastContactAt")}
                  </button>
                </TableHead>
                <TableHead className="py-3.5 px-3">
                  <button
                    onClick={() => handleSort("nextFollowUpAt")}
                    className="flex items-center gap-1.5 hover:text-red-600 dark:hover:text-red-400 transition-colors group cursor-pointer"
                  >
                    <span>المتابعة القادمة</span>
                    {renderSortIcon("nextFollowUpAt")}
                  </button>
                </TableHead>
                <TableHead className="py-3.5 px-4 text-left">
                  <button
                    onClick={() => handleSort("lifetimeSales")}
                    className="flex items-center gap-1.5 mr-auto hover:text-red-600 dark:hover:text-red-400 transition-colors group cursor-pointer"
                  >
                    <span>إجمالي المبيعات</span>
                    {renderSortIcon("lifetimeSales")}
                  </button>
                </TableHead>
                <TableHead className="py-3.5 px-3 text-center">
                  <span>إجراءات</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {paginatedCustomers.map((c) => {
                const stale = isCustomerStale(c.lastContactAt, c.isVip);
                const daysSince = getDaysSinceContact(c.lastContactAt);
                const nextOverdue = isOverdue(c.nextFollowUpAt);
                const typeInfo = customerTypeConfig[c.type] || customerTypeConfig.individual;
                const TypeIcon = typeInfo.icon;
                const isCopied = copiedId === c.id;

                return (
                  <TableRow
                    key={c.id}
                    onClick={() => router.push(`/customers/${c.id}`)}
                    className="hover:bg-stone-50/75 dark:hover:bg-stone-800/50 cursor-pointer transition-colors group text-xs"
                  >
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105",
                            typeInfo.bgClass
                          )}
                        >
                          <TypeIcon className={cn("h-4 w-4", typeInfo.iconClass)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={`/customers/${c.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold text-stone-900 dark:text-stone-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate max-w-[200px]"
                            >
                              {c.name}
                            </Link>
                            {c.isVip && (
                              <Badge
                                variant="outline"
                                className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 gap-0.5 px-1.5 py-0 text-[10px] font-bold"
                              >
                                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-500" />
                                <span>VIP</span>
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                            {c.contactPerson && (
                              <span className="text-stone-600 dark:text-stone-400 font-medium truncate max-w-[120px]">
                                أ. {c.contactPerson}
                              </span>
                            )}
                            {(c.address || c.city) && (
                              <span className="inline-flex items-center gap-0.5 truncate max-w-[150px]">
                                <MapPin className="h-2.5 w-2.5 shrink-0 opacity-70" />
                                <span>{c.address || c.city}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono text-stone-700 dark:text-stone-300 whitespace-nowrap text-left select-all"
                          dir="ltr"
                        >
                          {c.phone}
                        </span>
                        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={(e) => handleCopyPhone(e, c.id, c.phone)}
                                className="text-stone-400 hover:text-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
                                aria-label="نسخ رقم الهاتف"
                              >
                                {isCopied ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isCopied ? "تم النسخ!" : "نسخ الرقم"}</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={(e) => handleWhatsAppClick(e, c.phone, c.name)}
                                className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                aria-label="مراسلة واتساب"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>مراسلة عبر واتساب</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={(e) => handlePhoneClick(e, c.phone)}
                                className="text-stone-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                aria-label="اتصال هاتفي مباشر"
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>اتصال هاتفي</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <Badge
                        variant="outline"
                        className={cn("px-2 py-0.5 font-bold text-[11px] gap-1", typeInfo.badgeClass)}
                      >
                        <TypeIcon className="h-3 w-3" />
                        <span>{typeInfo.label}</span>
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      <MachineFleetPopover machines={c.installedMachines} />
                    </TableCell>

                    <TableCell className="py-3 px-3 font-medium text-stone-700 dark:text-stone-300">
                      <div className="flex items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 text-[9px] font-bold text-stone-600 dark:text-stone-300">
                          {c.assignedRepName.slice(0, 1)}
                        </div>
                        <span className="truncate max-w-[90px]">{c.assignedRepName}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      {stale ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 gap-1 text-[10px] font-bold py-0.5"
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                          <span>منذ {daysSince} يوماً</span>
                        </Badge>
                      ) : (
                        <span className="text-stone-600 dark:text-stone-300 whitespace-nowrap">
                          {formatBranchRelative(c.lastContactAt)}
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-3">
                      {c.nextFollowUpAt ? (
                        <Badge
                          variant={nextOverdue ? "destructive" : "outline"}
                          className={cn(
                            "gap-1 font-medium text-[10px] py-0.5 whitespace-nowrap",
                            !nextOverdue && "border-stone-200 bg-stone-50 text-stone-700 dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-200"
                          )}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>{formatBranchDate(c.nextFollowUpAt)}</span>
                          {nextOverdue && <span className="font-bold">(متأخرة)</span>}
                        </Badge>
                      ) : (
                        <span className="text-stone-400 dark:text-stone-500 text-[11px]">غير مجدول</span>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-4 text-left">
                      <div className="font-mono font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                        {formatEgp(c.lifetimeSales)}
                      </div>
                      {c.openPipelineValue > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 justify-end">
                          <TrendingUp className="h-2.5 w-2.5" />
                          <span className="font-mono tabular-nums">{formatEgp(c.openPipelineValue)}</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center">
                        <ActionMenu
                          label={`إجراءات ${c.name}`}
                          actions={[
                            {
                              label: "عرض ملف العميل 360",
                              icon: UserRound,
                              onSelect: () => router.push(`/customers/${c.id}`),
                            },
                            ...(onAddFollowUp
                              ? [
                                  {
                                    label: "إضافة متابعة جديدة",
                                    icon: CalendarPlus,
                                    onSelect: () => onAddFollowUp(c),
                                  },
                                ]
                              : []),
                            ...(onLogInteraction
                              ? [
                                  {
                                    label: "تسجيل تواصل فوري",
                                    icon: MessageCircle,
                                    onSelect: () => onLogInteraction(c),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>


      </div>
    </TooltipProvider>
  );
}
