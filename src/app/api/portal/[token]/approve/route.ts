import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken } from "@/lib/portal-token";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { ensureJobForAcceptedQuote, QuoteAlreadyLinkedError } from "@/lib/quote-to-job";

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
    const quote = await prisma.quote.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        status: true,
        customerId: true,
        quoteNumber: true,
        jobId: true,
        serviceType: true,
        notes: true,
        customer: { select: { address: true, city: true, state: true, zip: true } },
      },
    });
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

    let spawnedJobId: string | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        await tx.quote.update({
          where: { id: quote.id },
          data: { status: "ACCEPTED" },
        });

        const { created, jobId: newJobId } = await ensureJobForAcceptedQuote(tx, {
          id: quote.id,
          quoteNumber: quote.quoteNumber,
          customerId: quote.customerId,
          serviceType: quote.serviceType,
          jobId: quote.jobId,
          notes: quote.notes,
          customer: quote.customer,
        });
        if (created) spawnedJobId = newJobId;
      });
    } catch (err) {
      if (err instanceof QuoteAlreadyLinkedError) {
        // Concurrent approval won the race; treat as already-accepted success.
        return NextResponse.json({ success: true, alreadyAccepted: true });
      }
      throw err;
    }

    logActivity({
      type: "QUOTE_APPROVED",
      customerId: quote.customerId,
      jobId: spawnedJobId ?? quote.jobId ?? undefined,
      quoteId: quote.id,
      description: `Quote ${quote.quoteNumber} approved by customer (via portal)`,
    });

    if (spawnedJobId) {
      logActivity({
        type: "JOB_CREATED",
        customerId: quote.customerId,
        jobId: spawnedJobId,
        quoteId: quote.id,
        description: `Job auto-created from quote ${quote.quoteNumber}`,
        metadata: { quoteNumber: quote.quoteNumber, source: "portal-auto-accepted" },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[portal/approve] DB error:", err);
    return NextResponse.json({ error: "Failed to approve quote. Please try again." }, { status: 500 });
  }
}
