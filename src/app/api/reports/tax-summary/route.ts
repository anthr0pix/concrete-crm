import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getQuarterRange(year: number, quarter: number): { start: Date; end: Date } {
  const startMonth = (quarter - 1) * 3;
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, startMonth + 3, 1),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    const quarters = [];

    for (let q = 1; q <= 4; q++) {
      const { start, end } = getQuarterRange(year, q);

      // Revenue: sum of PAID invoices by paidDate
      const paidInvoices = await prisma.invoice.findMany({
        where: {
          status: "PAID",
          paidDate: {
            gte: start,
            lt: end,
          },
        },
        select: { total: true },
      });

      const revenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

      // Expenses: grouped by category
      const quarterExpenses = await prisma.expense.findMany({
        where: {
          date: {
            gte: start,
            lt: end,
          },
        },
        select: {
          amount: true,
          category: true,
        },
      });

      const expensesByCategory: Record<string, number> = {};
      let totalExpenses = 0;

      for (const exp of quarterExpenses) {
        const cat = exp.category;
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + exp.amount;
        totalExpenses += exp.amount;
      }

      // Round values
      for (const key of Object.keys(expensesByCategory)) {
        expensesByCategory[key] = Math.round(expensesByCategory[key] * 100) / 100;
      }

      quarters.push({
        quarter: q,
        revenue: Math.round(revenue * 100) / 100,
        expenses: expensesByCategory,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netIncome: Math.round((revenue - totalExpenses) * 100) / 100,
      });
    }

    return NextResponse.json({ year, quarters });
  } catch (error) {
    console.error("Tax summary report error:", error);
    return NextResponse.json(
      { error: "Failed to generate tax summary report" },
      { status: 500 }
    );
  }
}
