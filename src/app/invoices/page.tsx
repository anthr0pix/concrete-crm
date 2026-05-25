import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Receipt } from "lucide-react";
import { INVOICE_STATUS_LABELS, STATUS_COLORS } from "@/types";
import { InvoiceStatus } from "@prisma/client";
import { format, isPast, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import SortSelect from "@/components/ui/sort-select";
import Pagination from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const STATUS_TABS = ["ALL", ...Object.keys(INVOICE_STATUS_LABELS)] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "due_date", label: "Due Date" },
  { value: "amount_high", label: "Amount High\u2192Low" },
];

const SORT_MAP: Record<string, object> = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  due_date: { dueDate: "asc" },
  amount_high: { total: "desc" },
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; sort?: string; page?: string }>;
}) {
  const { search, status, sort, page } = await searchParams;
  const activeStatus = status && status !== "ALL" ? (status as InvoiceStatus) : undefined;
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const orderBy = SORT_MAP[sort || "newest"] || SORT_MAP.newest;

  const where = {
    ...(activeStatus ? { status: activeStatus } : {}),
    ...(search
      ? {
          OR: [
            { invoiceNumber: { contains: search, mode: "insensitive" as const } },
            { customer: { firstName: { contains: search, mode: "insensitive" as const } } },
            { customer: { lastName: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [invoices, totalCount, paidAgg, outstandingAgg] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where: { status: "PAID" },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { status: { in: ["SENT", "OVERDUE"] } },
      _sum: { total: true },
    }),
  ]);

  const totalPaid = paidAgg._sum.total ?? 0;
  const totalOutstanding = outstandingAgg._sum.total ?? 0;

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground text-sm mt-1">{totalCount} total</p>
        </div>
        <Link href="/invoices/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-status-success-bg rounded-xl shadow-sm border-l-4 border-l-green-500 p-4">
          <p className="text-sm text-status-success-text font-medium">Total Collected</p>
          <p className="text-2xl font-bold text-status-success-text">${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-status-orange-bg rounded-xl shadow-sm border-l-4 border-l-orange-500 p-4">
          <p className="text-sm text-status-orange-text font-medium">Unpaid Invoices</p>
          <p className="text-2xl font-bold text-status-orange-text">${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 mb-4">
        <form className="flex-1">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search by invoice number or customer name..."
              className="pl-9"
            />
          </div>
        </form>
        <Suspense fallback={<div className="border rounded-md px-2 py-2 sm:py-1.5 text-sm w-28 bg-card" />}>
          <SortSelect options={SORT_OPTIONS} basePath="/invoices" />
        </Suspense>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => {
          const params = new URLSearchParams();
          if (s !== "ALL") params.set("status", s);
          if (search) params.set("search", search);
          if (sort) params.set("sort", sort);
          const href = params.toString() ? `/invoices?${params}` : "/invoices";
          const isActive = (s === "ALL" && !activeStatus) || s === activeStatus;
          return (
            <Link key={s} href={href}>
              <button
                className={cn(
                  "px-3 py-2 sm:py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-150",
                  isActive
                    ? "text-white"
                    : "bg-card border text-muted-foreground hover:bg-muted"
                )}
                style={isActive ? { background: "linear-gradient(135deg, var(--mws-navy) 0%, var(--secondary) 100%)" } : {}}
              >
                {s === "ALL" ? "All" : INVOICE_STATUS_LABELS[s]}
              </button>
            </Link>
          );
        })}
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices found"
          description={
            search || activeStatus
              ? "Try adjusting your search or filter."
              : "Invoices are created from accepted quotes, or you can create one manually."
          }
          action={
            !search && !activeStatus
              ? { label: "+ New Invoice", href: "/invoices/new" }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const isOverdue = inv.status === "OVERDUE";
            const isPastDue = inv.status === "SENT" && inv.dueDate && isPast(startOfDay(new Date(inv.dueDate)));
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <div className={cn(
                  "flex items-center justify-between bg-card border rounded-xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all duration-150 cursor-pointer",
                  isOverdue && "border-l-4 border-l-red-500 bg-status-danger-bg/50",
                )}>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{inv.invoiceNumber}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[inv.status]}`}>
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </span>
                      {isPastDue && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-status-amber-bg text-status-amber-text">
                          Past due
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {inv.customer.firstName} {inv.customer.lastName} · {format(new Date(inv.createdAt), "MMM d, yyyy")}
                      {inv.dueDate && ` · Due ${format(new Date(inv.dueDate), "MMM d")}`}
                    </p>
                  </div>
                  <p className="font-bold text-lg">${inv.total.toFixed(2)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        baseUrl="/invoices"
        searchParams={{ search, status, sort }}
      />
    </div>
  );
}
