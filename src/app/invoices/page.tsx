import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { INVOICE_STATUS_LABELS, STATUS_COLORS } from "@/types";
import { InvoiceStatus } from "@prisma/client";
import { format, isPast, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import SortSelect from "@/components/ui/sort-select";
import Pagination from "@/components/ui/pagination";

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">{totalCount} total</p>
        </div>
        <Link href="/invoices/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">Total Collected</p>
          <p className="text-2xl font-bold text-green-800">${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <p className="text-sm text-orange-700 font-medium">Unpaid Invoices</p>
          <p className="text-2xl font-bold text-orange-800">${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 mb-4">
        <form className="flex-1">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by invoice number or customer name..."
              className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </form>
        <Suspense fallback={<div className="border rounded-md px-2 py-1.5 text-sm w-28 bg-white" />}>
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
          return (
            <Link key={s} href={href}>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  (s === "ALL" && !activeStatus) || s === activeStatus
                    ? "bg-slate-900 text-white"
                    : "bg-white border text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s === "ALL" ? "All" : INVOICE_STATUS_LABELS[s]}
              </button>
            </Link>
          );
        })}
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">No invoices found</p>
          <p className="text-sm mt-1">
            {search || activeStatus
              ? "Try adjusting your search or filter."
              : "Invoices are created from accepted quotes, or you can create one manually."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const isOverdue = inv.status === "OVERDUE";
            const isPastDue = inv.status === "SENT" && inv.dueDate && isPast(startOfDay(new Date(inv.dueDate)));
            return (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <div className={cn(
                  "flex items-center justify-between bg-white border rounded-lg px-5 py-4 hover:shadow-sm transition-shadow cursor-pointer",
                  isOverdue && "border-l-4 border-l-red-500 bg-red-50/50",
                )}>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{inv.invoiceNumber}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status]}`}>
                        {INVOICE_STATUS_LABELS[inv.status]}
                      </span>
                      {isPastDue && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Past due
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
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
