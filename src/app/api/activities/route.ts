import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const jobId = searchParams.get("jobId");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 100);
    const cursor = searchParams.get("cursor");

    if (!customerId) {
      return NextResponse.json({ error: "customerId is required" }, { status: 400 });
    }

    const where: Record<string, unknown> = { customerId };
    if (jobId) where.jobId = jobId;

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = activities.length > limit;
    if (hasMore) activities.pop();

    return NextResponse.json({
      activities,
      nextCursor: hasMore ? activities[activities.length - 1].id : null,
    });
  } catch (error) {
    console.error("[activities] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
