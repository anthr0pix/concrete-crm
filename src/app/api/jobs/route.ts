import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ServiceType, JobStatus } from "@prisma/client";

const jobSchema = z.object({
  customerId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType),
  status: z.nativeEnum(JobStatus).default("LEAD"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  scheduledDate: z.string().optional(),
  squareFootage: z.number().optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customerId");

  // Validate status enum if provided
  if (status) {
    const statusCheck = z.nativeEnum(JobStatus).safeParse(status);
    if (!statusCheck.success) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  try {
    const jobs = await prisma.job.findMany({
      where: {
        ...(status ? { status: status as JobStatus } : {}),
        ...(customerId ? { customerId } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, phone: true } },
        _count: { select: { photos: true } },
      },
    });

    return NextResponse.json(jobs);
  } catch (err) {
    console.error("[GET jobs]", err);
    return NextResponse.json({ error: "Failed to fetch jobs." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const { scheduledDate, ...rest } = parsed.data;
    const job = await prisma.job.create({
      data: {
        ...rest,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    console.error("[POST job]", err);
    return NextResponse.json({ error: "Failed to create job." }, { status: 500 });
  }
}
