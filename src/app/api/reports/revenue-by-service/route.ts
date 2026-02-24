import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SERVICE_TYPE_LABELS } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const defaultStart = new Date(now.getFullYear(), 0, 1);
    const defaultEnd = new Date(now.getFullYear() + 1, 0, 1);

    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const startDate = startDateParam ? new Date(startDateParam) : defaultStart;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEnd;

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    // Fetch PAID invoices with their associated job's serviceType
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: "PAID",
        paidDate: {
          gte: startDate,
          lt: endDate,
        },
        jobId: { not: null },
      },
      select: {
        total: true,
        job: {
          select: {
            serviceType: true,
          },
        },
      },
    });

    // Group by serviceType
    const revenueByService: Record<string, number> = {};

    for (const invoice of paidInvoices) {
      if (invoice.job) {
        const st = invoice.job.serviceType;
        revenueByService[st] = (revenueByService[st] || 0) + invoice.total;
      }
    }

    // Build response array
    const data = Object.entries(revenueByService)
      .map(([serviceType, revenue]) => ({
        serviceType,
        label: SERVICE_TYPE_LABELS[serviceType] || serviceType,
        revenue: Math.round(revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Revenue by service report error:", error);
    return NextResponse.json(
      { error: "Failed to generate revenue by service report" },
      { status: 500 }
    );
  }
}
