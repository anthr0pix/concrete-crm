import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "date-fns";

export async function POST() {
  try {
    const now = new Date();
    const result = await prisma.quote.updateMany({
      where: {
        status: "SENT",
        OR: [
          { lastFollowUpAt: { not: null, lt: subDays(now, 7) } },
          { lastFollowUpAt: null, updatedAt: { lt: subDays(now, 7) } },
        ],
      },
      data: { status: "EXPIRED" },
    });

    return NextResponse.json({ expired: result.count });
  } catch (error) {
    console.error("Failed to expire stale quotes:", error);
    return NextResponse.json(
      { error: "Failed to expire stale quotes" },
      { status: 500 }
    );
  }
}
