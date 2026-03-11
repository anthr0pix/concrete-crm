import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextInvoiceNumber } from "@/lib/numbering";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const source = await prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: true },
    });
    if (!source) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const invoiceNumber = await getNextInvoiceNumber();

    const duplicate = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: source.customerId,
        jobId: source.jobId ?? undefined,
        status: "DRAFT",
        subtotal: source.subtotal,
        taxRate: source.taxRate,
        taxAmount: source.taxAmount,
        total: source.total,
        dueDate: source.dueDate ?? undefined,
        notes: source.notes ?? undefined,
        paidDate: null,
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
    console.error("[POST invoice duplicate]", err);
    return NextResponse.json({ error: "Failed to duplicate invoice." }, { status: 500 });
  }
}
