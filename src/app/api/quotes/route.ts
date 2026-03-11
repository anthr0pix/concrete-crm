import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextQuoteNumber } from "@/lib/numbering";
import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const quoteSchema = z.object({
  customerId: z.string().min(1),
  jobId: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item required"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  try {
    const quotes = await prisma.quote.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        lineItems: true,
      },
    });
    return NextResponse.json(quotes);
  } catch (err) {
    console.error("[GET quotes]", err);
    return NextResponse.json({ error: "Failed to fetch quotes." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const { lineItems, taxRate, validUntil, ...rest } = parsed.data;
    const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    const quoteNumber = await getNextQuoteNumber();

    const quote = await prisma.quote.create({
      data: {
        ...rest,
        quoteNumber,
        taxRate,
        subtotal,
        taxAmount,
        total,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        lineItems: { create: lineItems.map((item) => ({ ...item, total: item.quantity * item.unitPrice })) },
      },
      include: { lineItems: true },
    });

    // Auto-transition: creating a quote for a LEAD job → QUOTED
    if (rest.jobId) {
      await prisma.job.updateMany({
        where: { id: rest.jobId, status: "LEAD" },
        data: { status: "QUOTED" },
      });
    }

    return NextResponse.json(quote, { status: 201 });
  } catch (err) {
    console.error("[POST quote]", err);
    return NextResponse.json({ error: "Failed to create quote." }, { status: 500 });
  }
}
