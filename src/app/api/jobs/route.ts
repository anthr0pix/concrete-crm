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
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = jobSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { scheduledDate, ...rest } = parsed.data;
  const job = await prisma.job.create({
    data: {
      ...rest,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
    },
  });

  return NextResponse.json(job, { status: 201 });
}
