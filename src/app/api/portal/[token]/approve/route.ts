import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/lib/portal-token";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let payload: { type: "quote" | "invoice"; id: string };
  try {
    payload = await verifyPortalToken(token);
  } catch {
    return NextResponse.json({ error: "This link has expired or is invalid." }, { status: 401 });
  }

  if (payload.type !== "quote") {
    return NextResponse.json({ error: "This link cannot be used to approve a quote." }, { status: 400 });
  }

  try {
    const quote = await prisma.quote.findUnique({ where: { id: payload.id } });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    if (quote.status === "ACCEPTED") {
      return NextResponse.json({ success: true, alreadyAccepted: true });
    }

    if (quote.status === "DECLINED" || quote.status === "EXPIRED") {
      return NextResponse.json(
        { error: `This quote has already been ${quote.status.toLowerCase()} and cannot be approved.` },
        { status: 409 }
      );
    }

    await prisma.quote.update({
      where: { id: payload.id },
      data: { status: "ACCEPTED" },
    });

    // Auto-transition linked job from LEAD → QUOTED
    if (quote.jobId) {
      try {
        const linkedJob = await prisma.job.findUnique({
          where: { id: quote.jobId },
          select: { status: true },
        });
        if (linkedJob && linkedJob.status === "LEAD") {
          await prisma.job.update({
            where: { id: quote.jobId },
            data: { status: "QUOTED" },
          });
        }
      } catch (err) {
        // Log but don't fail the approval if job transition fails
        console.error("[portal/approve] Job auto-transition error:", err);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[portal/approve] DB error:", err);
    return NextResponse.json({ error: "Failed to approve quote. Please try again." }, { status: 500 });
  }
}
