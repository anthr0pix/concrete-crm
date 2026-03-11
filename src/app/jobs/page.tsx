import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS, STATUS_COLORS } from "@/types";
import { JobStatus } from "@prisma/client";
import { format, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import SortSelect from "@/components/ui/sort-select";
import Pagination from "@/components/ui/pagination";

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
    { label: "Leads", count: countMap["LEAD"] ?? 0, color: "bg-slate-50 border-slate-200 text-slate-700" },
    { label: "Scheduled", count: countMap["SCHEDULED"] ?? 0, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
    { label: "In Progress", count: countMap["IN_PROGRESS"] ?? 0, color: "bg-orange-50 border-orange-200 text-orange-700" },
    { label: "Completed", count: countMap["COMPLETED"] ?? 0, color: "bg-green-50 border-green-200 text-green-700" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-slate-500 text-sm mt-1">{totalCount} jobs</p>
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
          <div key={card.label} className={`border rounded-lg p-3 ${card.color}`}>
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
          <input
            name="search"
            defaultValue={search}
            placeholder="Search by job title or customer name..."
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </form>
        <Suspense fallback={<div className="border rounded-md px-2 py-1.5 text-sm w-28 bg-white" />}>
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
          return (
            <Link key={s} href={href}>
              <button
                className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  (s === "ALL" && !activeStatus) || s === activeStatus
                    ? "bg-slate-900 text-white"
                    : "bg-white border text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s === "ALL" ? "All" : JOB_STATUS_LABELS[s]}
              </button>
            </Link>
          );
        })}
      </div>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">No jobs found</p>
          <p className="text-sm mt-1">
            {search || activeStatus
              ? "Try adjusting your search or filter."
              : "Click 'New Job' to create one."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => {
            const isTodayJob = job.scheduledDate && isToday(new Date(job.scheduledDate));
            return (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className={cn(
                  "flex items-center justify-between bg-white border rounded-lg px-5 py-4 hover:shadow-sm transition-shadow cursor-pointer",
                  isTodayJob && "border-l-4 border-l-green-500",
                )}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-slate-900">{job.title}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                      {isTodayJob && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-sm text-slate-500">
                      <span>{job.customer.firstName} {job.customer.lastName}</span>
                      <span className="hidden sm:inline">{SERVICE_TYPE_LABELS[job.serviceType]}</span>
                      {job.scheduledDate && (
                        <span>{format(new Date(job.scheduledDate), "MMM d, yyyy")}</span>
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
