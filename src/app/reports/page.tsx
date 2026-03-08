import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SERVICE_TYPE_LABELS, EXPENSE_CATEGORY_LABELS } from "@/types";
import ProfitLossChart from "@/components/reports/ProfitLossChart";
import RevenueByCategoryChart from "@/components/reports/RevenueByCategoryChart";
import ARAgingTable from "@/components/reports/ARAgingTable";
import TaxSummaryCard from "@/components/reports/TaxSummaryCard";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const year = params.year ? parseInt(params.year, 10) : currentYear;
  const validYear = isNaN(year) ? currentYear : year;

  const startOfYear = new Date(validYear, 0, 1);
  const endOfYear = new Date(validYear + 1, 0, 1);

  // ── P&L Data ──────────────────────────────────────────────────────
  const paidInvoices = await prisma.invoice.findMany({
    where: {
      status: "PAID",
      paidDate: { gte: startOfYear, lt: endOfYear },
    },
    select: { total: true, paidDate: true },
  });

  const allExpenses = await prisma.expense.findMany({
    where: {
      date: { gte: startOfYear, lt: endOfYear },
    },
    select: { amount: true, date: true, category: true },
  });

  const plData = Array.from({ length: 12 }, (_, i) => {
    const revenue = paidInvoices
      .filter((inv) => inv.paidDate && inv.paidDate.getMonth() === i)
      .reduce((sum, inv) => sum + inv.total, 0);
    const expenses = allExpenses
      .filter((exp) => exp.date.getMonth() === i)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return {
      month: i,
      revenue: Math.round(revenue * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      profit: Math.round((revenue - expenses) * 100) / 100,
    };
  });

  // ── Revenue by Service ────────────────────────────────────────────
  const invoicesWithJobs = await prisma.invoice.findMany({
    where: {
      status: "PAID",
      paidDate: { gte: startOfYear, lt: endOfYear },
      jobId: { not: null },
    },
    select: {
      total: true,
      job: { select: { serviceType: true } },
    },
  });

  const revenueByServiceMap: Record<string, number> = {};
  for (const inv of invoicesWithJobs) {
    if (inv.job) {
      const st = inv.job.serviceType;
      revenueByServiceMap[st] = (revenueByServiceMap[st] || 0) + inv.total;
    }
  }
  const revenueData = Object.entries(revenueByServiceMap)
    .map(([serviceType, revenue]) => ({
      serviceType,
      label: SERVICE_TYPE_LABELS[serviceType] || serviceType,
      revenue: Math.round(revenue * 100) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // ── AR Aging ──────────────────────────────────────────────────────
  const unpaidInvoices = await prisma.invoice.findMany({
    where: { status: { in: ["SENT", "OVERDUE"] } },
    select: { total: true, dueDate: true, createdAt: true },
  });

  const now = new Date();
  const arBuckets: Record<string, { count: number; total: number }> = {
    "0-30": { count: 0, total: 0 },
    "31-60": { count: 0, total: 0 },
    "61-90": { count: 0, total: 0 },
    "90+": { count: 0, total: 0 },
  };
  let totalOutstanding = 0;

  for (const inv of unpaidInvoices) {
    const refDate = inv.dueDate || inv.createdAt;
    const daysOut = Math.floor(
      (now.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    let key: string;
    if (daysOut <= 30) key = "0-30";
    else if (daysOut <= 60) key = "31-60";
    else if (daysOut <= 90) key = "61-90";
    else key = "90+";

    arBuckets[key].count += 1;
    arBuckets[key].total = Math.round((arBuckets[key].total + inv.total) * 100) / 100;
    totalOutstanding += inv.total;
  }
  totalOutstanding = Math.round(totalOutstanding * 100) / 100;

  // ── Tax Summary (Quarterly) ───────────────────────────────────────
  const taxQuarters = [];
  for (let q = 1; q <= 4; q++) {
    const qStart = new Date(validYear, (q - 1) * 3, 1);
    const qEnd = new Date(validYear, q * 3, 1);

    const qRevenue = paidInvoices
      .filter((inv) => inv.paidDate && inv.paidDate >= qStart && inv.paidDate < qEnd)
      .reduce((sum, inv) => sum + inv.total, 0);

    const qExpenses = allExpenses.filter(
      (exp) => exp.date >= qStart && exp.date < qEnd
    );

    const expensesByCategory: Record<string, number> = {};
    let qTotalExpenses = 0;
    for (const exp of qExpenses) {
      const cat = exp.category;
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + exp.amount;
      qTotalExpenses += exp.amount;
    }
    for (const key of Object.keys(expensesByCategory)) {
      expensesByCategory[key] = Math.round(expensesByCategory[key] * 100) / 100;
    }

    taxQuarters.push({
      quarter: q,
      revenue: Math.round(qRevenue * 100) / 100,
      expenses: expensesByCategory,
      totalExpenses: Math.round(qTotalExpenses * 100) / 100,
      netIncome: Math.round((qRevenue - qTotalExpenses) * 100) / 100,
    });
  }

  // ── Year navigation ───────────────────────────────────────────────
  const availableYears = [currentYear - 2, currentYear - 1, currentYear];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Reports</h1>
      <p className="text-sm text-slate-500 mb-6">Revenue, expenses, and profit at a glance. Select a year to filter.</p>

      {/* Year selector */}
      <div className="flex gap-2 mb-6">
        {availableYears.map((y) => (
          <Link
            key={y}
            href={`/reports?year=${y}`}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              y === validYear
                ? "bg-[#1a1a2e] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {y}
          </Link>
        ))}
      </div>

      {/* P&L Chart */}
      <div className="bg-white border rounded-lg p-5 mb-6">
        <h2 className="font-semibold text-lg mb-4">Profit &amp; Loss</h2>
        <ProfitLossChart data={plData} />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold text-lg mb-4">Revenue by Service</h2>
          <RevenueByCategoryChart data={revenueData} />
        </div>
        <div className="bg-white border rounded-lg p-5">
          <h2 className="font-semibold text-lg mb-4">Unpaid Invoice Aging</h2>
          <ARAgingTable
            buckets={arBuckets}
            totalOutstanding={totalOutstanding}
          />
        </div>
      </div>

      {/* Tax Summary */}
      <div className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold text-lg mb-4">Tax Summary</h2>
        <TaxSummaryCard quarters={taxQuarters} />
      </div>
    </div>
  );
}
