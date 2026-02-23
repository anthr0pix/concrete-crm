import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Briefcase, FileText, Receipt, TrendingUp, Clock } from "lucide-react";
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/types";
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

export default async function DashboardPage() {
  const [
    totalCustomers,
    jobCounts,
    recentJobs,
    upcomingJobs,
    revenue,
    openInvoices,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.job.groupBy({ by: ["status"], _count: true }),
    prisma.job.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.job.findMany({
      where: { status: "SCHEDULED", scheduledDate: { gte: new Date() } },
      orderBy: { scheduledDate: "asc" },
      take: 5,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { total: true } }),
    prisma.invoice.aggregate({ where: { status: { in: ["SENT", "OVERDUE"] } }, _sum: { total: true } }),
  ]);

  const statusMap = Object.fromEntries(jobCounts.map((j) => [j.status, j._count]));
  const activeJobs = (statusMap["LEAD"] ?? 0) + (statusMap["QUOTED"] ?? 0) +
    (statusMap["SCHEDULED"] ?? 0) + (statusMap["IN_PROGRESS"] ?? 0);

  const stats = [
    { label: "Total Customers", value: totalCustomers, icon: Users, href: "/customers", color: "text-blue-600" },
    { label: "Active Jobs", value: activeJobs, icon: Briefcase, href: "/jobs", color: "text-orange-600" },
    { label: "Revenue Collected", value: `$${(revenue._sum.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, href: "/invoices", color: "text-green-600" },
    { label: "Outstanding", value: `$${(openInvoices._sum.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Receipt, href: "/invoices", color: "text-red-600" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link key={label} href={href}>
            <div className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className={`${color} mb-3`}><Icon className="w-5 h-5" /></div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Job Status Breakdown */}
      <div className="bg-white border rounded-lg p-5 mb-6">
        <h2 className="font-semibold mb-4">Jobs by Status</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(JOB_STATUS_LABELS).map(([status, label]) => (
            <Link key={status} href={`/jobs?status=${status}`}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer ${STATUS_COLORS[status]}`}>
                <span>{label}</span>
                <span className="font-bold">{statusMap[status] ?? 0}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Upcoming Jobs */}
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold">Upcoming Scheduled</h2>
          </div>
          {upcomingJobs.length === 0 ? (
            <p className="text-sm text-slate-400">No upcoming jobs scheduled</p>
          ) : (
            <div className="space-y-3">
              {upcomingJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex justify-between items-start hover:bg-slate-50 rounded px-2 py-1.5 -mx-2">
                    <div>
                      <p className="text-sm font-medium">{job.title}</p>
                      <p className="text-xs text-slate-400">{job.customer.firstName} {job.customer.lastName}</p>
                    </div>
                    {job.scheduledDate && (
                      <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                        {format(new Date(job.scheduledDate), "MMM d")}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold">Recent Activity</h2>
          </div>
          {recentJobs.length === 0 ? (
            <p className="text-sm text-slate-400">No jobs yet</p>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex justify-between items-start hover:bg-slate-50 rounded px-2 py-1.5 -mx-2">
                    <div>
                      <p className="text-sm font-medium">{job.title}</p>
                      <p className="text-xs text-slate-400">{job.customer.firstName} {job.customer.lastName} · {SERVICE_TYPE_LABELS[job.serviceType]}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${STATUS_COLORS[job.status]}`}>
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
