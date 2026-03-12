import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText } from "lucide-react";
import { QUOTE_STATUS_LABELS, STATUS_COLORS } from "@/types";
import { QuoteStatus } from "@prisma/client";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import SortSelect from "@/components/ui/sort-select";
import Pagination from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const STATUS_TABS = ["ALL", ...Object.keys(QUOTE_STATUS_LABELS)] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "amount_high", label: "Amount High\u2192Low" },
  { value: "amount_low", label: "Amount Low\u2192High" },
];

const SORT_MAP: Record<string, object> = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  amount_high: { total: "desc" },
  amount_low: { total: "asc" },
};

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; sort?: string; page?: string }>;
}) {
  const { search, status, sort, page } = await searchParams;
  const activeStatus = status && status !== "ALL" ? (status as QuoteStatus) : undefined;
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const orderBy = SORT_MAP[sort || "newest"] || SORT_MAP.newest;

  const where = {
    ...(activeStatus ? { status: activeStatus } : {}),
    ...(search
      ? {
          OR: [
            { quoteNumber: { contains: search, mode: "insensitive" as const } },
            { customer: { firstName: { contains: search, mode: "insensitive" as const } } },
            { customer: { lastName: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [quotes, totalCount] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        lineItems: true,
      },
    }),
    prisma.quote.count({ where }),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-muted-foreground text-sm mt-1">{totalCount} total</p>
        </div>
        <Link href="/quotes/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Quote</Button>
        </Link>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 mb-4">
        <form className="flex-1">
          {activeStatus && <input type="hidden" name="status" value={activeStatus} />}
          {sort && <input type="hidden" name="sort" value={sort} />}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by quote number or customer name..."
              className="w-full border rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </form>
        <Suspense fallback={<div className="border rounded-md px-2 py-1.5 text-sm w-28 bg-card" />}>
          <SortSelect options={SORT_OPTIONS} basePath="/quotes" />
        </Suspense>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => {
          const params = new URLSearchParams();
          if (s !== "ALL") params.set("status", s);
          if (search) params.set("search", search);
          if (sort) params.set("sort", sort);
          const href = params.toString() ? `/quotes?${params}` : "/quotes";
          const isActive = (s === "ALL" && !activeStatus) || s === activeStatus;
          return (
            <Link key={s} href={href}>
              <button
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-150",
                  isActive
                    ? "text-white"
                    : "bg-card border text-muted-foreground hover:bg-muted"
                )}
                style={isActive ? { background: "linear-gradient(135deg, var(--mws-navy) 0%, var(--secondary) 100%)" } : {}}
              >
                {s === "ALL" ? "All" : QUOTE_STATUS_LABELS[s]}
              </button>
            </Link>
          );
        })}
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-lg font-medium">No quotes found</p>
          <p className="text-sm mt-1">
            {search || activeStatus
              ? "Try adjusting your search or filter."
              : "Create a quote to send a price estimate to a customer."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {quotes.map((q) => {
            const isStale = q.status === "SENT" && new Date(q.updatedAt) < subDays(new Date(), 7);
            return (
            <Link key={q.id} href={`/quotes/${q.id}`}>
              <div className="flex items-center justify-between bg-card rounded-xl shadow-sm px-5 py-4 hover:shadow-md hover:-translate-y-px transition-all duration-150 cursor-pointer">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{q.quoteNumber}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[q.status]}`}>
                      {QUOTE_STATUS_LABELS[q.status]}
                    </span>
                    {isStale && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-status-amber-bg text-status-amber-text">
                        Stale
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {q.customer.firstName} {q.customer.lastName} · {format(new Date(q.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${q.total.toFixed(2)}</p>
                  {q.validUntil && (
                    <p className="text-xs text-muted-foreground">Valid until {format(new Date(q.validUntil), "MMM d")}</p>
                  )}
                </div>
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
        baseUrl="/quotes"
        searchParams={{ search, status, sort }}
      />
    </div>
  );
}
