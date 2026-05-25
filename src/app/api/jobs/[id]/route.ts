import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ServiceType, JobStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType).optional(),
  status: z.nativeEnum(JobStatus).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  scheduledDate: z.string().nullable().optional(),
  completedDate: z.string().nullable().optional(),
  resealDueDate: z.string().nullable().optional(),
  squareFootage: z.number().nullable().optional(),
  notes: z.string().optional(),
  laborHours: z.number().nullable().optional(),
  laborRate: z.number().nullable().optional(),
  materialCost: z.number().nullable().optional(),
  crewAssignment: z.string().nullable().optional(),
  propertyManagerId: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        customer: true,
        propertyManager: { select: { id: true, companyName: true } },
        photos: { orderBy: { createdAt: "asc" } },
        quotes: { orderBy: { createdAt: "desc" } },
        invoices: { orderBy: { createdAt: "desc" } },
        expenses: { orderBy: { date: "desc" } },
      },
    });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(job);
  } catch (err) {
    console.error("[GET job]", err);
    return NextResponse.json({ error: "Failed to fetch job." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const { scheduledDate, completedDate, resealDueDate, propertyManagerId, ...rest } = parsed.data;

    // Fetch current job for auto-transition logic and status change logging
    const current = await prisma.job.findUnique({
      where: { id },
      select: { status: true, customerId: true, title: true },
    });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Auto-transition: setting a scheduledDate on a LEAD or QUOTED job → SCHEDULED
    let autoStatus: JobStatus | undefined;
    if (scheduledDate && !rest.status) {
      if (current.status === "LEAD" || current.status === "CONTACTED" || current.status === "QUOTED") {
        autoStatus = "SCHEDULED";
      }
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        ...rest,
        ...(autoStatus ? { status: autoStatus } : {}),
        ...(scheduledDate !== undefined ? { scheduledDate: scheduledDate ? new Date(scheduledDate) : null } : {}),
        ...(completedDate !== undefined ? { completedDate: completedDate ? new Date(completedDate) : null } : {}),
        ...(resealDueDate !== undefined ? { resealDueDate: resealDueDate ? new Date(resealDueDate) : null } : {}),
        ...(propertyManagerId !== undefined ? { propertyManagerId } : {}),
      },
    });

    // Log status change activity
    const newStatus = rest.status ?? autoStatus;
    if (newStatus && newStatus !== current.status) {
      logActivity({
        type: "STATUS_CHANGED",
        customerId: current.customerId,
        jobId: id,
        description: `Job status changed from ${current.status} to ${newStatus}`,
        metadata: { oldStatus: current.status, newStatus },
      });
    }

    return NextResponse.json(job);
  } catch (err) {
    console.error("[PATCH job]", err);
    return NextResponse.json({ error: "Failed to update job." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.quote.updateMany({ where: { jobId: id }, data: { jobId: null } });
      await tx.invoice.updateMany({ where: { jobId: id }, data: { jobId: null } });
      await tx.expense.updateMany({ where: { jobId: id }, data: { jobId: null } });
      await tx.job.delete({ where: { id } });
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE job]", err);
    return NextResponse.json({ error: "Failed to delete job." }, { status: 500 });
  }
}
