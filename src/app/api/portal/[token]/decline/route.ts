import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/lib/portal-token";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";

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
    return NextResponse.json({ error: "This link cannot be used to decline a quote." }, { status: 400 });
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: payload.id },
      select: { id: true, status: true, customerId: true, quoteNumber: true, jobId: true },
    });
    if (!quote) {
      return NextResponse.json({ error: "Quote not found." }, { status: 404 });
    }

    if (quote.status === "DECLINED") {
      return NextResponse.json({ success: true, alreadyDeclined: true });
    }

    if (quote.status === "DRAFT") {
      return NextResponse.json(
        { error: "This quote has not been sent yet." },
        { status: 400 }
      );
    }

    if (quote.status === "ACCEPTED" || quote.status === "EXPIRED") {
      return NextResponse.json(
        { error: `This quote has already been ${quote.status.toLowerCase()} and cannot be declined.` },
        { status: 409 }
      );
    }

    await prisma.quote.update({
      where: { id: payload.id },
      data: { status: "DECLINED" },
    });

    logActivity({
      type: "QUOTE_DECLINED",
      customerId: quote.customerId,
      jobId: quote.jobId ?? undefined,
      quoteId: quote.id,
      description: `Quote ${quote.quoteNumber} declined by customer`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[portal/decline] DB error:", err);
    return NextResponse.json({ error: "Failed to decline quote. Please try again." }, { status: 500 });
  }
}
