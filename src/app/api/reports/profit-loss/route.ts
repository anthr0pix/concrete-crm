import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year + 1, 0, 1);

    // Fetch all PAID invoices for the year (by paidDate)
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidDate: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
      select: {
        total: true,
        paidDate: true,
      },
    });

    // Fetch all expenses for the year (by date)
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startOfYear,
          lt: endOfYear,
        },
      },
      select: {
        amount: true,
        date: true,
      },
    });

    // Build monthly data
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthRevenue = paidInvoices
        .filter((inv) => inv.paidDate && inv.paidDate.getMonth() === i)
        .reduce((sum, inv) => sum + inv.total, 0);

      const monthExpenses = expenses
        .filter((exp) => exp.date.getMonth() === i)
        .reduce((sum, exp) => sum + exp.amount, 0);

      return {
        month: i,
        revenue: Math.round(monthRevenue * 100) / 100,
        expenses: Math.round(monthExpenses * 100) / 100,
        profit: Math.round((monthRevenue - monthExpenses) * 100) / 100,
      };
    });

    return NextResponse.json({ year, months });
  } catch (error) {
    console.error("Profit/Loss report error:", error);
    return NextResponse.json(
      { error: "Failed to generate profit/loss report" },
      { status: 500 }
    );
  }
}
