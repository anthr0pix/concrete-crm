import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { QuoteStatus, ServiceType } from "@prisma/client";
import { z } from "zod";
import { ensureJobForAcceptedQuote, QuoteAlreadyLinkedError } from "@/lib/quote-to-job";
import { logActivity } from "@/lib/activity";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const updateSchema = z.object({
  status: z.nativeEnum(QuoteStatus).optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  notes: z.string().optional(),
  validUntil: z.string().nullable().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  lineItems: z.array(lineItemSchema).min(1).optional(),
  depositAmount: z.number().nullable().optional(),
  depositType: z.enum(["FIXED", "PERCENTAGE"]).nullable().optional(),
  jobId: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        job: true,
        lineItems: true,
      },
    });
    if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(quote);
  } catch (err) {
    console.error("[GET quote]", err);
    return NextResponse.json({ error: "Failed to fetch quote." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const { validUntil, lineItems, taxRate, depositAmount, depositType, jobId, ...rest } = parsed.data;

    const existing = await prisma.quote.findUnique({
      where: { id },
      select: { status: true, jobId: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (lineItems && existing.status !== "DRAFT") {
      return NextResponse.json({ error: "Can only edit line items on DRAFT quotes" }, { status: 400 });
    }

    const becomingAccepted =
      rest.status === "ACCEPTED" && existing.status !== "ACCEPTED";

    // Recalculate totals if line items or tax rate changed
    let totals: { subtotal: number; taxAmount: number; total: number } | undefined;
    if (lineItems) {
      const subtotal = lineItems.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
      const rate = taxRate ?? 0;
      const taxAmount = subtotal * (rate / 100);
      totals = { subtotal, taxAmount, total: subtotal + taxAmount };
    }

    let spawnedJobId: string | null = null;

    const quote = await prisma.$transaction(async (tx) => {
      if (lineItems) {
        await tx.quoteLineItem.deleteMany({ where: { quoteId: id } });
      }

      const updated = await tx.quote.update({
        where: { id },
        data: {
          ...rest,
          ...(validUntil !== undefined ? { validUntil: validUntil ? new Date(validUntil) : null } : {}),
          ...(taxRate !== undefined ? { taxRate } : {}),
          ...(depositAmount !== undefined ? { depositAmount } : {}),
          ...(depositType !== undefined ? { depositType } : {}),
          ...(jobId !== undefined ? { jobId: jobId || null } : {}),
          ...totals,
          ...(lineItems ? {
            lineItems: {
              create: lineItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
              })),
            },
          } : {}),
        },
        include: {
          lineItems: true,
          customer: { select: { address: true, city: true, state: true, zip: true } },
        },
      });

      if (becomingAccepted) {
        const { created, jobId: newJobId } = await ensureJobForAcceptedQuote(tx, {
          id: updated.id,
          quoteNumber: updated.quoteNumber,
          customerId: updated.customerId,
          serviceType: updated.serviceType,
          jobId: updated.jobId,
          notes: updated.notes,
          customer: updated.customer,
        });
        if (created) spawnedJobId = newJobId;
      }

      return updated;
    });

    if (spawnedJobId) {
      logActivity({
        type: "JOB_CREATED",
        customerId: quote.customerId,
        jobId: spawnedJobId,
        quoteId: quote.id,
        description: `Job auto-created from quote ${quote.quoteNumber}`,
        metadata: { quoteNumber: quote.quoteNumber, source: "auto-accepted" },
      });
    }

    return NextResponse.json(quote);
  } catch (err) {
    if (err instanceof QuoteAlreadyLinkedError) {
      return NextResponse.json({ error: "Quote already linked to a job." }, { status: 409 });
    }
    console.error("[PATCH quote]", err);
    return NextResponse.json({ error: "Failed to update quote." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE quote]", err);
    return NextResponse.json({ error: "Failed to delete quote." }, { status: 500 });
  }
}
