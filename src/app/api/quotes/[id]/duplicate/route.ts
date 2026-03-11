import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextQuoteNumber } from "@/lib/numbering";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const source = await prisma.quote.findUnique({
      where: { id },
      include: { lineItems: true },
    });
    if (!source) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const quoteNumber = await getNextQuoteNumber();

    const duplicate = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId: source.customerId,
        jobId: source.jobId ?? undefined,
        status: "DRAFT",
        subtotal: source.subtotal,
        taxRate: source.taxRate,
        taxAmount: source.taxAmount,
        total: source.total,
        validUntil: source.validUntil ?? undefined,
        notes: source.notes ?? undefined,
        depositAmount: source.depositAmount ?? undefined,
        depositType: source.depositType ?? undefined,
        depositPaid: false,
        followUpCount: 0,
        lineItems: {
          create: source.lineItems.map(({ description, quantity, unitPrice, total }) => ({
            description,
            quantity,
            unitPrice,
            total,
          })),
        },
      },
      include: { lineItems: true },
    });

    return NextResponse.json(duplicate, { status: 201 });
  } catch (err) {
    console.error("[POST quote duplicate]", err);
    return NextResponse.json({ error: "Failed to duplicate quote." }, { status: 500 });
  }
}
