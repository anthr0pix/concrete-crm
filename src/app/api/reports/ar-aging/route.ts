import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Find all unpaid invoices (SENT or OVERDUE)
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        status: { in: ["SENT", "OVERDUE"] },
      },
      select: {
        total: true,
        dueDate: true,
        createdAt: true,
      },
    });

    const now = new Date();
    const buckets: Record<string, { count: number; total: number }> = {
      "0-30": { count: 0, total: 0 },
      "31-60": { count: 0, total: 0 },
      "61-90": { count: 0, total: 0 },
      "90+": { count: 0, total: 0 },
    };

    let totalOutstanding = 0;

    for (const invoice of unpaidInvoices) {
      const referenceDate = invoice.dueDate || invoice.createdAt;
      const daysOutstanding = Math.floor(
        (now.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let bucketKey: string;
      if (daysOutstanding <= 30) {
        bucketKey = "0-30";
      } else if (daysOutstanding <= 60) {
        bucketKey = "31-60";
      } else if (daysOutstanding <= 90) {
        bucketKey = "61-90";
      } else {
        bucketKey = "90+";
      }

      buckets[bucketKey].count += 1;
      buckets[bucketKey].total = Math.round((buckets[bucketKey].total + invoice.total) * 100) / 100;
      totalOutstanding += invoice.total;
    }

    return NextResponse.json({
      buckets,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    });
  } catch (error) {
    console.error("AR aging report error:", error);
    return NextResponse.json(
      { error: "Failed to generate AR aging report" },
      { status: 500 }
    );
  }
}
