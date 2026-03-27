import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  FileText,
  User,
  Calendar,
  ArrowRight,
} from "lucide-react";
import { QUOTE_STATUS_LABELS, STATUS_COLORS } from "@/types";
import { QuoteStatus } from "@prisma/client";
import { format, subDays } from "date-fns";
import { cn, formatCurrency } from "@/lib/utils";
import {
  ExpireQuoteButton,
  ExpireAllStaleButton,
} from "@/components/quotes/ExpireQuoteButton";

export const dynamic = "force-dynamic";

const STATUS_TABS = ["ALL", ...Object.keys(QUOTE_STATUS_LABELS)] as const;

const STATUS_BORDER: Record<string, string> = {
  DRAFT: "border-l-amber-400",
  SENT: "border-l-blue-400",
  ACCEPTED: "border-l-green-400",
  DECLINED: "border-l-red-400",
  EXPIRED: "border-l-orange-400",
};

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const { search, status } = await searchParams;
  const isStaleFilter = status === "STALE";
  const activeStatus =
    status && status !== "ALL" && status !== "STALE"
      ? (status as QuoteStatus)
      : undefined;

  const now = new Date();
  const staleWhere = {
    status: "SENT" as const,
    OR: [
      { lastFollowUpAt: { not: null, lt: subDays(now, 7) } },
      { lastFollowUpAt: null, updatedAt: { lt: subDays(now, 7) } },
    ],
  };

  const searchWhere = search
    ? {
        OR: [
          { quoteNumber: { contains: search, mode: "insensitive" as const } },
          {
            customer: {
              firstName: { contains: search, mode: "insensitive" as const },
            },
          },
          {
            customer: {
              lastName: { contains: search, mode: "insensitive" as const },
            },
          },
        ],
      }
    : {};

  const where = {
    ...(isStaleFilter
      ? staleWhere
      : activeStatus
        ? { status: activeStatus }
        : {}),
    ...searchWhere,
  };

  const [quotes, statusCounts, staleCount] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        lineItems: true,
        job: { select: { id: true, title: true } },
      },
    }),
    prisma.quote.groupBy({ by: ["status"], _count: true }),
    prisma.quote.count({ where: staleWhere }),
  ]);

  const countMap = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count]),
  );
  const totalCount = statusCounts.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalCount} total
          </p>
        </div>
        <Link href="/quotes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Quote
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <form>
          {activeStatus && (
            <input type="hidden" name="status" value={activeStatus} />
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              name="search"
              defaultValue={search}
              placeholder="Search by quote number or customer name..."
              className="pl-9"
            />
          </div>
        </form>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => {
          const params = new URLSearchParams();
          if (s !== "ALL") params.set("status", s);
          if (search) params.set("search", search);
          const href = params.toString() ? `/quotes?${params}` : "/quotes";
          const isActive =
            (s === "ALL" && !activeStatus && !isStaleFilter) ||
            s === activeStatus;
          const count = s === "ALL" ? totalCount : (countMap[s] ?? 0);
          return (
            <Link key={s} href={href}>
              <button
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-150",
                  isActive
                    ? "bg-card text-foreground shadow-sm border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                {s === "ALL" ? "All" : QUOTE_STATUS_LABELS[s]}
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {count}
                </span>
              </button>
            </Link>
          );
        })}
        {staleCount > 0 && (
          <Link
            href={`/quotes?status=STALE${search ? `&search=${search}` : ""}`}
          >
            <button
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-all duration-150",
                isStaleFilter
                  ? "bg-status-amber-bg text-status-amber-text shadow-sm border border-amber-200"
                  : "text-status-amber-text hover:bg-status-amber-bg",
              )}
            >
              Stale
              <span className="ml-1.5 text-xs">{staleCount}</span>
            </button>
          </Link>
        )}
      </div>

      {/* Stale banner */}
      {staleCount > 0 && !activeStatus && !isStaleFilter && (
        <div className="flex items-center gap-2 bg-status-amber-bg rounded-lg px-4 py-2.5 mb-4">
          <span className="text-sm text-status-amber-text">
            <strong>{staleCount}</strong> stale quote
            {staleCount !== 1 ? "s" : ""} — sent over 7 days ago with no
            response
          </span>
          <ExpireAllStaleButton />
        </div>
      )}

      {quotes.length === 0 ? (
        <div className="text-center py-20 rounded-xl border-2 border-dashed border-border">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-lg font-semibold text-foreground mb-1">
            No quotes found
          </p>
          <p className="text-sm text-muted-foreground mb-5">
            {search || activeStatus
              ? "Try adjusting your search or filter."
              : "Create a quote to send a price estimate to a customer."}
          </p>
          {!search && !activeStatus && (
            <Link href="/quotes/new">
              <Button>+ New Quote</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((q) => {
            const lastOutreach = q.lastFollowUpAt ?? q.updatedAt;
            const isStale =
              q.status === "SENT" && new Date(lastOutreach) < subDays(now, 7);
            const borderColor = STATUS_BORDER[q.status] || "border-l-slate-400";

            return (
              <div key={q.id} className="relative group">
                <Link href={`/quotes/${q.id}`}>
                  <div
                    className={`bg-card border border-l-4 ${borderColor} rounded-xl shadow-sm p-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all duration-150 cursor-pointer h-full flex flex-col`}
                  >
                    {/* Header: quote number + status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-foreground">
                        {q.quoteNumber}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isStale && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-status-amber-bg text-status-amber-text">
                            Stale
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_COLORS[q.status]}`}
                        >
                          {QUOTE_STATUS_LABELS[q.status]}
                        </span>
                      </div>
                    </div>

                    {/* Customer + job */}
                    <div className="space-y-1 mb-3">
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate font-medium text-foreground">
                          {q.customer.firstName} {q.customer.lastName}
                        </span>
                      </p>
                      {q.job && (
                        <p className="text-xs text-muted-foreground truncate pl-5">
                          {q.job.title}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="mb-3">
                      <p className="text-2xl font-bold text-foreground">
                        {formatCurrency(q.total)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {q.lineItems.length} line item
                        {q.lineItems.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Footer: date + valid until */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(q.createdAt), "MMM d, yyyy")}
                      </span>
                      {q.validUntil && (
                        <span
                          className={cn(
                            "text-xs",
                            new Date(q.validUntil) < now
                              ? "text-status-danger-text"
                              : "text-muted-foreground",
                          )}
                        >
                          {new Date(q.validUntil) < now
                            ? "Expired "
                            : "Valid until "}
                          {format(new Date(q.validUntil), "MMM d")}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                    </div>
                  </div>
                </Link>

                {/* Expire button for stale quotes */}
                {isStale && (
                  <div className="absolute top-2 right-2">
                    <ExpireQuoteButton quoteId={q.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
