import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

function getMonthRange(date: Date) {
  return { gte: startOfMonth(date), lte: endOfMonth(date) };
}

async function getMonthData(date: Date) {
  const range = getMonthRange(date);

  try {
    const [paidInvoices, completedJobs] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          status: "PAID",
          paidDate: range,
        },
        select: { total: true },
      }),
      prisma.job.findMany({
        where: {
          status: "COMPLETED",
          completedDate: range,
        },
        select: { laborHours: true, laborRate: true, materialCost: true },
      }),
    ]);

    const revenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const laborCost = completedJobs.reduce(
      (sum, job) => sum + (job.laborHours ?? 0) * (job.laborRate ?? 0),
      0
    );
    const materialCost = completedJobs.reduce(
      (sum, job) => sum + (job.materialCost ?? 0),
      0
    );
    const profit = revenue - laborCost - materialCost;

    return { revenue, laborCost, materialCost, profit };
  } catch {
    return { revenue: 0, laborCost: 0, materialCost: 0, profit: 0 };
  }
}

export async function GET() {
  try {
    const now = new Date();
    const lastMonthDate = subMonths(now, 1);

    const [currentMonth, lastMonth] = await Promise.all([
      getMonthData(now),
      getMonthData(lastMonthDate),
    ]);

    return NextResponse.json({ currentMonth, lastMonth });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch profitability data" },
      { status: 500 }
    );
  }
}
