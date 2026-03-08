import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Briefcase, FileText, Receipt, TrendingUp, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/types";
import { format, startOfMonth, endOfMonth } from "date-fns";

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
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    totalCustomers,
    jobCounts,
    recentJobs,
    upcomingJobs,
    revenue,
    openInvoices,
    monthlyPaidInvoices,
    monthlyCompletedJobs,
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
    prisma.invoice.findMany({
      where: { status: "PAID", paidDate: { gte: monthStart, lte: monthEnd } },
      select: { total: true },
    }),
    prisma.job.findMany({
      where: {
        status: "COMPLETED",
        completedDate: { gte: monthStart, lte: monthEnd },
      },
      select: { laborHours: true, laborRate: true, materialCost: true },
    }),
  ]);

  const statusMap = Object.fromEntries(jobCounts.map((j) => [j.status, j._count]));
  const activeJobs = (statusMap["LEAD"] ?? 0) + (statusMap["QUOTED"] ?? 0) +
    (statusMap["SCHEDULED"] ?? 0) + (statusMap["IN_PROGRESS"] ?? 0);

  const stats = [
    { label: "Total Customers", value: totalCustomers, icon: Users, href: "/customers", color: "text-blue-600" },
    { label: "Active Jobs", subtitle: "Lead, Quoted, Scheduled & In Progress", value: activeJobs, icon: Briefcase, href: "/jobs", color: "text-orange-600" },
    { label: "Revenue Collected", value: `$${(revenue._sum.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, href: "/invoices", color: "text-green-600" },
    { label: "Unpaid Invoices", value: `$${(openInvoices._sum.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Receipt, href: "/invoices", color: "text-red-600" },
  ];

  const monthlyRevenue = monthlyPaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const monthlyLabor = monthlyCompletedJobs.reduce(
    (sum, job) => sum + (job.laborHours ?? 0) * (job.laborRate ?? 0),
    0
  );
  const monthlyMaterials = monthlyCompletedJobs.reduce(
    (sum, job) => sum + (job.materialCost ?? 0),
    0
  );
  const monthlyProfit = monthlyRevenue - monthlyLabor - monthlyMaterials;

  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalJobs = jobCounts.reduce((sum, j) => sum + j._count, 0);
  const isNewUser = totalCustomers === 0 && totalJobs === 0;

  const gettingStartedSteps = [
    { done: totalCustomers > 0, label: "Add your first customer", description: "Add their name, phone, and address.", href: "/customers/new", cta: "Add Customer" },
    { done: totalJobs > 0, label: "Create a job", description: "Track work for a customer — sealing, coating, etc.", href: "/jobs/new", cta: "Create Job" },
    { done: (revenue._sum.total ?? 0) > 0, label: "Send a quote & get paid", description: "Create a quote, send it, then convert to an invoice.", href: "/quotes/new", cta: "New Quote" },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Getting Started — only shown for new users */}
      {isNewUser && (
        <div className="bg-white border-2 border-dashed border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="font-semibold text-lg mb-1">Welcome to Mountain West Surface CRM</h2>
          <p className="text-sm text-slate-500 mb-4">Here&apos;s how to get started. Follow these steps in order:</p>
          <div className="space-y-3">
            {gettingStartedSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-4 bg-slate-50 rounded-lg px-4 py-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${step.done ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                  {step.done ? "\u2713" : i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-slate-400">{step.description}</p>
                </div>
                {!step.done && (
                  <Link href={step.href}>
                    <Button size="sm" variant="outline" className="shrink-0">
                      {step.cta} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <div className="bg-white border rounded-lg p-5 hover:shadow-sm transition-shadow">
              <div className={`${stat.color} mb-3`}><stat.icon className="w-5 h-5" /></div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
              {"subtitle" in stat && <p className="text-xs text-slate-400 mt-0.5">{stat.subtitle}</p>}
            </div>
          </Link>
        ))}
      </div>

      {/* Monthly Profitability */}
      <div className="bg-white border rounded-lg p-5 mb-6">
        <h2 className="font-semibold mb-1">This Month</h2>
        <p className="text-xs text-slate-400 mb-3">{format(now, "MMMM yyyy")} — based on paid invoices and completed job costs.</p>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-400">Revenue</p>
            <p className="text-lg font-bold text-green-600">${fmt(monthlyRevenue)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Labor</p>
            <p className="text-lg font-bold text-slate-700">${fmt(monthlyLabor)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Materials</p>
            <p className="text-lg font-bold text-slate-700">${fmt(monthlyMaterials)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Profit</p>
            <p className={`text-lg font-bold ${monthlyProfit >= 0 ? "text-green-600" : "text-red-600"}`}>${fmt(monthlyProfit)}</p>
          </div>
        </div>
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
            <h2 className="font-semibold">Recent Jobs</h2>
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
