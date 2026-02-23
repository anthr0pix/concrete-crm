import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/types";
import { JobStatus } from "@prisma/client";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-700",
  QUOTED: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_TABS = ["ALL", ...Object.keys(JOB_STATUS_LABELS)] as const;

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = status && status !== "ALL" ? (status as JobStatus) : undefined;

  const jobs = await prisma.job.findMany({
    where: activeStatus ? { status: activeStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { firstName: true, lastName: true } },
    },
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="text-slate-500 text-sm mt-1">{jobs.length} jobs</p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Job
          </Button>
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <Link key={s} href={s === "ALL" ? "/jobs" : `/jobs?status=${s}`}>
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
        ))}
      </div>

      {/* Job list */}
      {jobs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">No jobs found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <div className="flex items-center justify-between bg-white border rounded-lg px-5 py-4 hover:shadow-sm transition-shadow cursor-pointer">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-900">{job.title}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    <span>{job.customer.firstName} {job.customer.lastName}</span>
                    <span>{SERVICE_TYPE_LABELS[job.serviceType]}</span>
                    {job.scheduledDate && (
                      <span>{format(new Date(job.scheduledDate), "MMM d, yyyy")}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
