import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  zip: z.string().min(1).optional(),
  notes: z.string().optional(),
  referralSource: z.string().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        jobs: { orderBy: { createdAt: "desc" } },
        quotes: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(customer);
  } catch (err) {
    console.error("[GET customer]", err);
    return NextResponse.json({ error: "Failed to fetch customer." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const customer = await prisma.customer.update({ where: { id }, data: parsed.data });
    return NextResponse.json(customer);
  } catch (err) {
    console.error("[PATCH customer]", err);
    return NextResponse.json({ error: "Failed to update customer." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.invoice.deleteMany({ where: { customerId: id } });
      await tx.quote.deleteMany({ where: { customerId: id } });
      await tx.job.deleteMany({ where: { customerId: id } });
      await tx.customer.delete({ where: { id } });
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE customer]", err);
    return NextResponse.json({ error: "Failed to delete customer." }, { status: 500 });
  }
}
