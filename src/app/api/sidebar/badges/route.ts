import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function GET() {
  try {
    const now = new Date();

    const [unquotedLeads, staleContacted, staleQuotes, overdueInvoices, overdueFollowUps] = await Promise.all([
      prisma.job.count({
        where: {
          status: "LEAD",
          quotes: { none: {} },
          createdAt: { lt: subDays(now, 3) },
        },
      }),
      prisma.job.count({
        where: {
          status: "CONTACTED",
          quotes: { none: {} },
          updatedAt: { lt: subDays(now, 3) },
        },
      }),
      prisma.quote.count({
        where: {
          status: "SENT",
          OR: [
            { lastFollowUpAt: { not: null, lt: subDays(now, 7) } },
            { lastFollowUpAt: null, updatedAt: { lt: subDays(now, 7) } },
          ],
        },
      }),
      prisma.invoice.count({
        where: {
          status: "SENT",
          dueDate: { lt: now },
        },
      }),
      prisma.propertyManager.count({
        where: {
          status: { notIn: ["WON", "LOST"] },
          nextFollowUpAt: { lt: now },
        },
      }),
    ]);

    return NextResponse.json({ unquotedLeads, staleContacted, staleQuotes, overdueInvoices, overdueFollowUps });
  } catch {
    return NextResponse.json({ unquotedLeads: 0, staleContacted: 0, staleQuotes: 0, overdueInvoices: 0, overdueFollowUps: 0 });
  }
}
