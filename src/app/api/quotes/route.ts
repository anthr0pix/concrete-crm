import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

async function getNextQuoteNumber(): Promise<string> {
  const last = await prisma.quote.findFirst({ orderBy: { quoteNumber: "desc" } });
  const num = last ? parseInt(last.quoteNumber.replace("Q-", ""), 10) + 1 : 1;
  return `Q-${String(num).padStart(4, "0")}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");

  const quotes = await prisma.quote.findMany({
    where: customerId ? { customerId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      lineItems: true,
    },
  });
  return NextResponse.json(quotes);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

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

  return NextResponse.json(quote, { status: 201 });
}
