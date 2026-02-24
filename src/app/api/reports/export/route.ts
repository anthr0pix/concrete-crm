import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EXPENSE_CATEGORY_LABELS } from "@/types";
import { format } from "date-fns";

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map((row) => row.map(escapeCSV).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const now = new Date();
  const currentYear = now.getFullYear();

  if (!type || !["expenses", "invoices", "profit-loss"].includes(type)) {
    return NextResponse.json(
      { error: 'Invalid type. Must be "expenses", "invoices", or "profit-loss".' },
      { status: 400 }
    );
  }

  const startDate =
    searchParams.get("startDate") || `${currentYear}-01-01`;
  const endDate =
    searchParams.get("endDate") || `${currentYear}-12-31`;

  try {
    if (type === "expenses") {
      const expenses = await prisma.expense.findMany({
        where: {
          date: {
            gte: new Date(startDate),
            lte: new Date(`${endDate}T23:59:59.999Z`),
          },
        },
        include: { job: true },
        orderBy: { date: "asc" },
      });

      const headers = ["Date", "Category", "Description", "Amount", "Vendor", "Job", "Notes"];
      const rows = expenses.map((e) => [
        format(new Date(e.date), "yyyy-MM-dd"),
        EXPENSE_CATEGORY_LABELS[e.category] || e.category,
        e.description,
        e.amount.toFixed(2),
        e.vendor,
        e.job?.title || "",
        e.notes,
      ]);

      const csvContent = toCSV(headers, rows);

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="expenses-${startDate}-${endDate}.csv"`,
        },
      });
    }

    if (type === "invoices") {
      const invoices = await prisma.invoice.findMany({
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(`${endDate}T23:59:59.999Z`),
          },
        },
        include: {
          customer: true,
          job: true,
        },
        orderBy: { createdAt: "asc" },
      });

      const headers = [
        "Invoice #",
        "Date",
        "Customer",
        "Job",
        "Status",
        "Subtotal",
        "Tax",
        "Total",
        "Paid Date",
      ];
      const rows = invoices.map((inv) => [
        inv.invoiceNumber,
        format(new Date(inv.createdAt), "yyyy-MM-dd"),
        `${inv.customer.firstName} ${inv.customer.lastName}`,
        inv.job?.title || "",
        inv.status,
        inv.subtotal.toFixed(2),
        inv.taxAmount.toFixed(2),
        inv.total.toFixed(2),
        inv.paidDate ? format(new Date(inv.paidDate), "yyyy-MM-dd") : "",
      ]);

      const csvContent = toCSV(headers, rows);

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="invoices-${startDate}-${endDate}.csv"`,
        },
      });
    }

    // profit-loss
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!, 10)
      : currentYear;

    const yearStart = new Date(`${year}-01-01`);
    const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

    const [paidInvoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          status: "PAID",
          paidDate: { gte: yearStart, lte: yearEnd },
        },
      }),
      prisma.expense.findMany({
        where: {
          date: { gte: yearStart, lte: yearEnd },
        },
      }),
    ]);

    const monthlyRevenue: Record<number, number> = {};
    const monthlyExpenses: Record<number, number> = {};

    for (let m = 0; m < 12; m++) {
      monthlyRevenue[m] = 0;
      monthlyExpenses[m] = 0;
    }

    for (const inv of paidInvoices) {
      if (inv.paidDate) {
        const month = new Date(inv.paidDate).getMonth();
        monthlyRevenue[month] += inv.total;
      }
    }

    for (const exp of expenses) {
      const month = new Date(exp.date).getMonth();
      monthlyExpenses[month] += exp.amount;
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const headers = ["Month", "Revenue", "Expenses", "Profit"];
    const rows = monthNames.map((name, i) => {
      const revenue = monthlyRevenue[i];
      const expenseTotal = monthlyExpenses[i];
      const profit = revenue - expenseTotal;
      return [name, revenue.toFixed(2), expenseTotal.toFixed(2), profit.toFixed(2)];
    });

    const plStartDate = `${year}-01-01`;
    const plEndDate = `${year}-12-31`;
    const csvContent = toCSV(headers, rows);

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="profit-loss-${plStartDate}-${plEndDate}.csv"`,
      },
    });
  } catch (err) {
    console.error("[GET reports/export]", err);
    return NextResponse.json(
      { error: "Failed to generate export." },
      { status: 500 }
    );
  }
}
