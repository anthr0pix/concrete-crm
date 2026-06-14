import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextInvoiceNumber } from "@/lib/numbering";
import { z } from "zod";
import { logActivity } from "@/lib/activity";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1),
  jobId: z.string().optional(),
  taxRate: z.number().min(0).max(100).default(0),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1),
});

const fromQuoteSchema = z.object({
  fromQuoteId: z.string(),
});

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    });
    return NextResponse.json(invoices);
  } catch (err) {
    console.error("[GET invoices]", err);
    return NextResponse.json({ error: "Failed to fetch invoices." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Check if converting from quote
  const fromQuoteParsed = fromQuoteSchema.safeParse(body);
  if (fromQuoteParsed.success) {
    try {
      const quote = await prisma.quote.findUnique({
        where: { id: fromQuoteParsed.data.fromQuoteId },
        include: { lineItems: true },
      });
      if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

      const invoiceNumber = await getNextInvoiceNumber();
      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          customerId: quote.customerId,
          jobId: quote.jobId ?? undefined,
          quoteId: quote.id,
          subtotal: quote.subtotal,
          taxRate: quote.taxRate,
          taxAmount: quote.taxAmount,
          total: quote.total,
          notes: quote.notes ?? undefined,
          lineItems: {
            create: quote.lineItems.map(({ description, quantity, unitPrice, total }) => ({
              description, quantity, unitPrice, total,
            })),
          },
        },
      });

      logActivity({
        type: "INVOICE_CREATED",
        customerId: quote.customerId,
        jobId: quote.jobId ?? undefined,
        invoiceId: invoice.id,
        quoteId: quote.id,
        description: `Invoice ${invoiceNumber} created ($${quote.total.toFixed(2)})`,
        metadata: { invoiceNumber, total: quote.total },
      });

      return NextResponse.json(invoice, { status: 201 });
    } catch (err) {
      console.error("[POST invoice from quote]", err);
      return NextResponse.json({ error: "Failed to create invoice from quote." }, { status: 500 });
    }
  }

  // Manual invoice creation
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const { lineItems, taxRate, dueDate, ...rest } = parsed.data;
    const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    const invoiceNumber = await getNextInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        ...rest,
        invoiceNumber,
        taxRate,
        subtotal,
        taxAmount,
        total,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        lineItems: { create: lineItems.map((item) => ({ ...item, total: item.quantity * item.unitPrice })) },
      },
    });

    logActivity({
      type: "INVOICE_CREATED",
      customerId: rest.customerId,
      jobId: rest.jobId,
      invoiceId: invoice.id,
      description: `Invoice ${invoiceNumber} created ($${total.toFixed(2)})`,
      metadata: { invoiceNumber, total },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error("[POST invoice]", err);
    return NextResponse.json({ error: "Failed to create invoice." }, { status: 500 });
  }
}
