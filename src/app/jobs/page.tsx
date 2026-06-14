import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Briefcase } from "lucide-react";
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS, STATUS_COLORS } from "@/types";
import { JobStatus } from "@prisma/client";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import SortSelect from "@/components/ui/sort-select";
import Pagination from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const STATUS_TABS = ["ALL", ...Object.keys(JOB_STATUS_LABELS)] as const;

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "scheduled", label: "Scheduled Date" },
  { value: "customer", label: "Customer Name" },
];

const SORT_MAP: Record<string, object> = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  scheduled: { scheduledDate: "asc" },
  customer: { customer: { lastName: "asc" } },
};

const SUMMARY_ACCENTS: Record<string, string> = {
  Leads: "border-l-4 border-l-slate-400",
  Scheduled: "border-l-4 border-l-yellow-400",
  "In Progress": "border-l-4 border-l-orange-400",
  Completed: "border-l-4 border-l-green-500",
};

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; sort?: string; page?: string }>;
}) {
  const { status, search, sort, page } = await searchParams;
  const activeStatus = status && status !== "ALL" ? (status as JobStatus) : undefined;
  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1);
  const orderBy = SORT_MAP[sort || "newest"] || SORT_MAP.newest;

  const where = {
    ...(activeStatus ? { status: activeStatus } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { customer: { firstName: { contains: search, mode: "insensitive" as const } } },
            { customer: { lastName: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [jobs, totalCount, statusCounts] = await Promise.all([
    prisma.job.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.job.count({ where }),
    prisma.job.groupBy({ by: ["status"], _count: true }),
  ]);

  const countMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));
  const summaryCards = [
    { label: "Leads", count: (countMap["LEAD"] ?? 0) + (countMap["CONTACTED"] ?? 0), color: "bg-status-neutral-bg text-status-neutral-text" },
    { label: "Scheduled", count: countMap["SCHEDULED"] ?? 0, color: "bg-status-warning-bg text-status-warning-text" },
    { label: "In Progress", count: countMap["IN_PROGRESS"] ?? 0, color: "bg-status-orange-bg text-status-orange-text" },
    { label: "Completed", count: countMap["COMPLETED"] ?? 0, color: "bg-status-success-bg text-status-success-text" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">{totalCount} jobs</p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Job
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-xl shadow-sm p-3 ${card.color} ${SUMMARY_ACCENTS[card.label]}`}>
            <p className="text-2xl font-bold">{card.count}</p>
            <p className="text-sm font-medium">{card.label}</p>
          </div>
        ))}
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
              placeholder="Search by job title or customer name..."
              className="pl-9"
            />
          </div>
        </form>
        <Suspense fallback={<div className="border rounded-md px-2 py-2 sm:py-1.5 text-sm w-28 bg-card" />}>
          <SortSelect options={SORT_OPTIONS} basePath="/jobs" />
        </Suspense>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => {
          const params = new URLSearchParams();
          if (s !== "ALL") params.set("status", s);
          if (search) params.set("search", search);
          if (sort) params.set("sort", sort);
          const href = params.toString() ? `/jobs?${params}` : "/jobs";
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
                {s === "ALL" ? "All" : JOB_STATUS_LABELS[s]}
              </button>
            </Link>
          );
        })}
      </div>

      {/* Job list */}
      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={
            search || activeStatus
              ? "Try adjusting your search or filter."
              : "Create your first job to start tracking work."
          }
          action={
            !search && !activeStatus
              ? { label: "+ New Job", href: "/jobs/new" }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const isTodayJob = job.scheduledDate && isToday(new Date(job.scheduledDate));
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className={cn(
                  "flex items-center justify-between bg-card border rounded-xl shadow-sm px-4 py-3 sm:px-5 sm:py-4 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all duration-150 cursor-pointer",
                  isTodayJob && "border-l-4 border-l-green-500",
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-semibold text-foreground">{job.title}</span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[job.status]}`}>
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                      {isTodayJob && (
                        <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-status-success-bg text-status-success-text">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-dot" />
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-sm text-muted-foreground">
                      <span>{job.customer.firstName} {job.customer.lastName}</span>
                      <span className="hidden sm:inline">{SERVICE_TYPE_LABELS[job.serviceType]}</span>
                      {job.scheduledDate ? (
                        <span>{format(new Date(job.scheduledDate), "MMM d, yyyy")}</span>
                      ) : (
                        <span>Submitted {format(new Date(job.createdAt), "MMM d, yyyy")}</span>
                      )}
                    </div>
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
        baseUrl="/jobs"
        searchParams={{ status, search, sort }}
      />
    </div>
  );
}
