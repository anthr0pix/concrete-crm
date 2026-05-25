import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Briefcase, FileText, Receipt, TrendingUp, TrendingDown, Clock, ArrowRight, Phone, MapPin, AlertTriangle, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS, STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, addDays, subMonths, formatDistanceToNow } from "date-fns";
import { ExpireQuoteButton, ExpireAllStaleButton } from "@/components/quotes/ExpireQuoteButton";

export const dynamic = "force-dynamic";

const ACCENT_COLORS: Record<string, { border: string; bg: string; icon: string }> = {
  "Total Customers": { border: "border-l-blue-500", bg: "bg-status-info-bg", icon: "text-status-info-text" },
  "Active Jobs": { border: "border-l-orange-500", bg: "bg-status-orange-bg", icon: "text-status-orange-text" },
  "Revenue Collected": { border: "border-l-green-500", bg: "bg-status-success-bg", icon: "text-status-success-text" },
  "Unpaid Invoices": { border: "border-l-red-500", bg: "bg-status-danger-bg", icon: "text-status-danger-text" },
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const prevMonthStart = startOfMonth(subMonths(now, 1));
  const prevMonthEnd = endOfMonth(subMonths(now, 1));

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [
    totalCustomers,
    jobCounts,
    recentJobs,
    upcomingJobs,
    revenue,
    openInvoices,
    monthlyPaidInvoices,
    monthlyCompletedJobs,
    todaysJobs,
    overdueInvoiceCount,
    unquotedLeads,
    staleContacted,
    staleQuotes,
    expiringQuotes,
    overdueInvoices,
    unbilledJobs,
    customersThisMonth,
    prevMonthActiveJobs,
    prevMonthRevenue,
    outreachCounts,
    overdueFollowUps,
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
    prisma.job.findMany({
      where: {
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        scheduledDate: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { scheduledDate: "asc" },
      include: {
        customer: {
          select: { firstName: true, lastName: true, phone: true },
        },
      },
    }),
    prisma.invoice.count({ where: { status: "OVERDUE" } }),
    // Needs Attention queries
    prisma.job.findMany({
      where: {
        status: "LEAD",
        quotes: { none: {} },
        createdAt: { lt: subDays(now, 3) },
      },
      orderBy: { createdAt: "asc" },
      take: 10,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.job.findMany({
      where: {
        status: "CONTACTED",
        quotes: { none: {} },
        updatedAt: { lt: subDays(now, 3) },
      },
      orderBy: { updatedAt: "asc" },
      take: 10,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.quote.findMany({
      where: {
        status: "SENT",
        OR: [
          { lastFollowUpAt: { not: null, lt: subDays(now, 7) } },
          { lastFollowUpAt: null, updatedAt: { lt: subDays(now, 7) } },
        ],
      },
      orderBy: { updatedAt: "asc" },
      take: 10,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    prisma.quote.findMany({
      where: {
        status: "SENT",
        validUntil: { gte: now, lte: addDays(now, 3) },
      },
      orderBy: { validUntil: "asc" },
      take: 10,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    // Overdue invoices — SENT with dueDate in the past
    prisma.invoice.findMany({
      where: {
        status: "SENT",
        dueDate: { lt: now },
      },
      orderBy: { dueDate: "asc" },
      take: 10,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    // Completed jobs with no invoice — work done but not billed (last 30 days)
    prisma.job.findMany({
      where: {
        status: "COMPLETED",
        invoices: { none: {} },
        completedDate: { gte: subDays(now, 30) },
      },
      orderBy: { completedDate: "asc" },
      take: 10,
      include: { customer: { select: { firstName: true, lastName: true } } },
    }),
    // Period comparison queries
    prisma.customer.count({ where: { createdAt: { gte: monthStart, lte: monthEnd } } }),
    prisma.job.count({
      where: {
        status: { in: ["LEAD", "CONTACTED", "QUOTED", "SCHEDULED", "IN_PROGRESS"] },
        updatedAt: { gte: prevMonthStart, lte: prevMonthEnd },
      },
    }),
    prisma.invoice.aggregate({
      where: { status: "PAID", paidDate: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { total: true },
    }),
    // Outreach pipeline
    prisma.propertyManager.groupBy({ by: ["status"], _count: true }),
    prisma.propertyManager.count({ where: { status: { notIn: ["WON", "LOST"] }, nextFollowUpAt: { lt: now } } }),
  ]);

  const statusMap = Object.fromEntries(jobCounts.map((j) => [j.status, j._count]));
  const activeJobs = (statusMap["LEAD"] ?? 0) + (statusMap["CONTACTED"] ?? 0) + (statusMap["QUOTED"] ?? 0) +
    (statusMap["SCHEDULED"] ?? 0) + (statusMap["IN_PROGRESS"] ?? 0);

  // Period comparisons
  const currentMonthRevenue = monthlyPaidInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const prevMonthRevenueTotal = prevMonthRevenue._sum.total ?? 0;
  const revenuePctChange = prevMonthRevenueTotal > 0
    ? Math.round(((currentMonthRevenue - prevMonthRevenueTotal) / prevMonthRevenueTotal) * 100)
    : null;
  const activeJobsPctChange = prevMonthActiveJobs > 0
    ? Math.round(((activeJobs - prevMonthActiveJobs) / prevMonthActiveJobs) * 100)
    : null;

  const stats = [
    { label: "Total Customers", value: totalCustomers, icon: Users, href: "/customers", color: "text-status-info-text", trend: customersThisMonth > 0 ? `+${customersThisMonth} this month` : null, trendUp: true },
    { label: "Active Jobs", subtitle: "Lead, Quoted, Scheduled & In Progress", value: activeJobs, icon: Briefcase, href: "/jobs", color: "text-status-orange-text", trend: activeJobsPctChange !== null && activeJobsPctChange !== 0 ? `${Math.abs(activeJobsPctChange)}% vs last month` : null, trendUp: activeJobsPctChange !== null ? activeJobsPctChange > 0 : null },
    { label: "Revenue Collected", value: `$${(revenue._sum.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, href: "/invoices", color: "text-status-success-text", trend: revenuePctChange !== null && revenuePctChange !== 0 ? `${Math.abs(revenuePctChange)}% vs last month` : null, trendUp: revenuePctChange !== null ? revenuePctChange > 0 : null },
    { label: "Unpaid Invoices", subtitle: overdueInvoiceCount > 0 ? `${overdueInvoiceCount} overdue` : undefined, value: `$${(openInvoices._sum.total ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: Receipt, href: "/invoices", color: "text-status-danger-text", trend: null, trendUp: null },
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

  // Jobs by status — bar chart data
  const statusEntries = Object.entries(JOB_STATUS_LABELS).map(([status, label]) => ({
    status,
    label,
    count: statusMap[status] ?? 0,
  }));
  const maxStatusCount = Math.max(...statusEntries.map((e) => e.count), 1);

  const STATUS_BAR_COLORS: Record<string, string> = {
    LEAD: "bg-slate-400",
    CONTACTED: "bg-sky-400",
    QUOTED: "bg-blue-400",
    SCHEDULED: "bg-yellow-400",
    IN_PROGRESS: "bg-orange-400",
    COMPLETED: "bg-green-500",
    CANCELLED: "bg-red-400",
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <h1 className="text-2xl sm:text-3xl font-bold">{getGreeting()}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {format(now, "EEEE, MMMM d, yyyy")} &middot; Updated {format(now, "h:mm a")}
        </p>
      </div>

      {/* Getting Started — only shown for new users */}
      {isNewUser && (
        <div className="bg-card rounded-xl shadow-sm border-2 border-dashed border-border p-6 mb-6">
          <h2 className="font-semibold text-base mb-1">Welcome to Mountain West Surface CRM</h2>
          <p className="text-sm text-muted-foreground mb-4">Here&apos;s how to get started. Follow these steps in order:</p>
          <div className="space-y-3">
            {gettingStartedSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-4 bg-muted rounded-lg px-4 py-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${step.done ? "bg-status-success-bg text-status-success-text" : "bg-status-info-bg text-status-info-text"}`}>
                  {step.done ? "\u2713" : i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {stats.map((stat) => {
          const accent = ACCENT_COLORS[stat.label];
          return (
            <Link key={stat.label} href={stat.href}>
              <div className={`bg-card rounded-xl shadow-sm border-l-4 ${accent.border} p-3 sm:p-5 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all duration-150`}>
                <div className={`w-9 h-9 rounded-lg ${accent.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${accent.icon}`} />
                </div>
                <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
                {"subtitle" in stat && stat.subtitle && <p className="text-xs text-muted-foreground mt-0.5">{stat.subtitle}</p>}
                {stat.trend && (
                  <p className={cn("text-xs mt-1 font-medium flex items-center gap-1",
                    stat.trendUp ? "text-emerald-600" : "text-red-600"
                  )}>
                    {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.trend}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Outreach Pipeline */}
      {(() => {
        const outreachMap = Object.fromEntries(outreachCounts.map((c) => [c.status, c._count]));
        const totalOutreach = outreachCounts.reduce((sum, c) => sum + c._count, 0);
        if (totalOutreach === 0) return null;
        return (
          <Link href="/outreach">
            <div className="bg-card rounded-xl shadow-sm border-l-4 border-l-purple-500 p-5 mb-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="w-4 h-4 text-purple-500" />
                <h2 className="font-semibold text-base">Outreach Pipeline</h2>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span>Prospects: <strong>{outreachMap["PROSPECT"] ?? 0}</strong></span>
                <span>Contacted: <strong>{outreachMap["CONTACTED"] ?? 0}</strong></span>
                <span>In Conversation: <strong>{outreachMap["IN_CONVERSATION"] ?? 0}</strong></span>
                <span>Proposals: <strong>{outreachMap["PROPOSAL_SENT"] ?? 0}</strong></span>
              </div>
              {overdueFollowUps > 0 && (
                <p className="mt-2 text-sm text-status-danger-text font-medium">
                  {overdueFollowUps} follow-up{overdueFollowUps !== 1 ? "s" : ""} overdue
                </p>
              )}
            </div>
          </Link>
        );
      })()}

      {/* Needs Attention */}
      {(unquotedLeads.length > 0 || staleContacted.length > 0 || staleQuotes.length > 0 || expiringQuotes.length > 0 || overdueInvoices.length > 0 || unbilledJobs.length > 0) && (
        <div className="bg-card rounded-xl shadow-sm border-l-4 border-l-amber-500 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-base">Needs Attention</h2>
            <span className="text-xs text-muted-foreground">
              {unquotedLeads.length + staleContacted.length + staleQuotes.length + expiringQuotes.length + overdueInvoices.length + unbilledJobs.length} items
            </span>
          </div>
          <div className="space-y-4">
            {unquotedLeads.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Unquoted Leads</p>
                <div className="space-y-1">
                  {unquotedLeads.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-0 hover:bg-muted rounded-lg px-3 py-2 -mx-2 transition-colors group">
                        <div className="flex items-center gap-2 min-w-0 sm:flex-1">
                          <span className="text-sm font-medium truncate">{job.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {job.customer.firstName} {job.customer.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 sm:ml-2">
                          <span className="text-xs text-status-amber-text">
                            {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {staleContacted.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Contacted — Needs Quote</p>
                <div className="space-y-1">
                  {staleContacted.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-0 hover:bg-muted rounded-lg px-3 py-2 -mx-2 transition-colors group">
                        <div className="flex items-center gap-2 min-w-0 sm:flex-1">
                          <span className="text-sm font-medium truncate">{job.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {job.customer.firstName} {job.customer.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 sm:ml-2">
                          <span className="text-xs text-status-amber-text">
                            contacted {formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {staleQuotes.length > 0 && (
              <div>
                <div className="flex items-center mb-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stale Quotes</p>
                  <ExpireAllStaleButton />
                </div>
                <div className="space-y-1">
                  {staleQuotes.map((quote) => (
                    <div key={quote.id} className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-0 hover:bg-muted rounded-lg px-3 py-2 -mx-2 transition-colors group">
                      <Link href={`/quotes/${quote.id}`} className="flex items-center gap-2 min-w-0 sm:flex-1">
                        <span className="text-sm font-medium">{quote.quoteNumber}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {quote.customer.firstName} {quote.customer.lastName}
                        </span>
                      </Link>
                      <div className="flex items-center gap-2 shrink-0 sm:ml-2">
                        <span className="text-xs text-status-amber-text">
                          sent {formatDistanceToNow(new Date(quote.updatedAt), { addSuffix: true })}
                        </span>
                        <ExpireQuoteButton quoteId={quote.id} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {expiringQuotes.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Expiring Soon</p>
                <div className="space-y-1">
                  {expiringQuotes.map((quote) => (
                    <Link key={quote.id} href={`/quotes/${quote.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-0 hover:bg-muted rounded-lg px-3 py-2 -mx-2 transition-colors group">
                        <div className="flex items-center gap-2 min-w-0 sm:flex-1">
                          <span className="text-sm font-medium">{quote.quoteNumber}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {quote.customer.firstName} {quote.customer.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 sm:ml-2">
                          <span className="text-xs text-status-danger-text">
                            expires {formatDistanceToNow(new Date(quote.validUntil!), { addSuffix: true })}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {overdueInvoices.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Overdue Invoices</p>
                <div className="space-y-1">
                  {overdueInvoices.map((invoice) => (
                    <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-0 hover:bg-muted rounded-lg px-3 py-2 -mx-2 transition-colors group">
                        <div className="flex items-center gap-2 min-w-0 sm:flex-1">
                          <span className="text-sm font-medium">{invoice.invoiceNumber}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {invoice.customer.firstName} {invoice.customer.lastName}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground shrink-0">
                            ${invoice.total.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 sm:ml-2">
                          <span className="text-xs text-status-danger-text">
                            due {formatDistanceToNow(new Date(invoice.dueDate!), { addSuffix: true })}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {unbilledJobs.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Completed — No Invoice</p>
                <div className="space-y-1">
                  {unbilledJobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-0 hover:bg-muted rounded-lg px-3 py-2 -mx-2 transition-colors group">
                        <div className="flex items-center gap-2 min-w-0 sm:flex-1">
                          <span className="text-sm font-medium truncate">{job.title}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {job.customer.firstName} {job.customer.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 sm:ml-2">
                          <span className="text-xs text-status-amber-text">
                            completed {job.completedDate ? formatDistanceToNow(new Date(job.completedDate), { addSuffix: true }) : ""}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Today's Jobs */}
      <div className="bg-card rounded-xl shadow-sm border-l-4 border-l-green-500 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="w-4 h-4 text-status-success-text" />
          <h2 className="font-semibold text-base">Today&apos;s Jobs</h2>
          <span className="text-xs text-muted-foreground">{format(now, "EEEE, MMM d")}</span>
        </div>
        {todaysJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs scheduled for today.</p>
        ) : (
          <div className="space-y-3">
            {todaysJobs.map((job) => {
              const addr = job.address
                ? `${job.address}, ${job.city}, ${job.state} ${job.zip}`
                : null;
              return (
                <div key={job.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between bg-status-success-bg/50 rounded-lg px-4 py-3 gap-2">
                  <div className="min-w-0 flex-1">
                    <Link href={`/jobs/${job.id}`} className="font-medium text-sm hover:underline">
                      {job.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.customer.firstName} {job.customer.lastName}
                    </p>
                    {addr && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{addr}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 sm:ml-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[job.status]}`}>
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                    {job.customer.phone && (
                      <a
                        href={`tel:${job.customer.phone}`}
                        className="p-1.5 rounded-md hover:bg-status-success-bg text-status-success-text"
                        title="Call customer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {addr && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-status-success-bg text-status-success-text"
                        title="Get directions"
                      >
                        <MapPin className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Profitability */}
      <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
        <h2 className="font-semibold text-base mb-1">This Month</h2>
        <p className="text-xs text-muted-foreground mb-3">{format(now, "MMMM yyyy")} — based on paid invoices and completed job costs.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="text-lg font-bold">
              <span className="inline-block bg-status-success-bg text-status-success-text px-2 py-0.5 rounded-md">${fmt(monthlyRevenue)}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Labor</p>
            <p className="text-lg font-bold text-muted-foreground">${fmt(monthlyLabor)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Materials</p>
            <p className="text-lg font-bold text-muted-foreground">${fmt(monthlyMaterials)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Profit</p>
            <p className={`text-lg font-bold ${monthlyProfit >= 0 ? "text-status-success-text" : "text-status-danger-text"}`}>${fmt(monthlyProfit)}</p>
          </div>
        </div>
      </div>

      {/* Job Status Breakdown — horizontal bar chart */}
      <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Jobs by Status</h2>
          <span className="text-xs text-muted-foreground">{totalJobs} total</span>
        </div>
        <div className="space-y-3">
          {statusEntries.map(({ status, label, count }) => (
            <Link key={status} href={`/jobs?status=${status}`}>
              <div className="group flex items-center gap-3 hover:bg-muted rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                <span className="text-sm text-muted-foreground w-24 shrink-0">{label}</span>
                <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${STATUS_BAR_COLORS[status] ?? "bg-slate-400"} transition-all duration-300`}
                    style={{ width: `${Math.max((count / maxStatusCount) * 100, count > 0 ? 8 : 0)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-foreground w-8 text-right">{count}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Upcoming Jobs */}
        <div className="bg-card border rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-base">Upcoming Scheduled</h2>
          </div>
          {upcomingJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming jobs scheduled</p>
          ) : (
            <div className="space-y-1">
              {upcomingJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex justify-between items-center hover:bg-muted rounded-lg px-3 py-2.5 -mx-2 transition-colors group">
                    <div>
                      <p className="text-sm font-medium">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.customer.firstName} {job.customer.lastName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {job.scheduledDate && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(job.scheduledDate), "MMM d")}
                        </span>
                      )}
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Jobs */}
        <div className="bg-card border rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-base">Recent Jobs</h2>
          </div>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No jobs yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex justify-between items-center hover:bg-muted rounded-lg px-3 py-2.5 -mx-2 transition-colors group">
                    <div>
                      <p className="text-sm font-medium">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.customer.firstName} {job.customer.lastName} · {SERVICE_TYPE_LABELS[job.serviceType]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLORS[job.status]}`}>
                        {JOB_STATUS_LABELS[job.status]}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
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
