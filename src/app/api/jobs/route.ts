import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { ServiceType, JobStatus } from "@prisma/client";
import { logActivity } from "@/lib/activity";

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
  propertyManagerId: z.string().optional(),
});

const fromQuoteSchema = z.object({
  fromQuoteId: z.string().min(1),
  serviceType: z.nativeEnum(ServiceType),
  title: z.string().optional(),
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

  // Branch: create from quote
  const fromQuoteParsed = fromQuoteSchema.safeParse(body);
  if (fromQuoteParsed.success) {
    const { fromQuoteId, serviceType, title } = fromQuoteParsed.data;
    try {
      const quote = await prisma.quote.findUnique({
        where: { id: fromQuoteId },
        include: { customer: true },
      });
      if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
      if (quote.status !== "ACCEPTED") {
        return NextResponse.json(
          { error: "Only accepted quotes can be converted to jobs." },
          { status: 400 }
        );
      }
      if (quote.jobId) {
        return NextResponse.json(
          { error: "This quote is already linked to a job.", existingJobId: quote.jobId },
          { status: 409 }
        );
      }

      const resolvedTitle = title?.trim() || `Job for ${quote.quoteNumber}`;

      const job = await prisma.$transaction(async (tx) => {
        const newJob = await tx.job.create({
          data: {
            customerId: quote.customerId,
            title: resolvedTitle,
            serviceType,
            status: "QUOTED",
            address: quote.customer.address ?? undefined,
            city: quote.customer.city ?? undefined,
            state: quote.customer.state ?? undefined,
            zip: quote.customer.zip ?? undefined,
            notes: quote.notes ?? undefined,
          },
        });
        const linked = await tx.quote.updateMany({
          where: { id: quote.id, jobId: null },
          data: { jobId: newJob.id },
        });
        if (linked.count === 0) throw new Error("QUOTE_ALREADY_LINKED");
        return newJob;
      });

      logActivity({
        type: "JOB_CREATED",
        customerId: quote.customerId,
        jobId: job.id,
        quoteId: quote.id,
        description: `Job '${job.title}' created from quote ${quote.quoteNumber}`,
        metadata: { quoteNumber: quote.quoteNumber },
      });

      return NextResponse.json(job, { status: 201 });
    } catch (err) {
      if (err instanceof Error && err.message === "QUOTE_ALREADY_LINKED") {
        return NextResponse.json(
          { error: "This quote is already linked to a job." },
          { status: 409 }
        );
      }
      console.error("[POST job from quote]", err);
      return NextResponse.json({ error: "Failed to create job from quote." }, { status: 500 });
    }
  }

  // Manual job creation
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

    logActivity({
      type: "JOB_CREATED",
      customerId: job.customerId,
      jobId: job.id,
      description: `Job '${job.title}' created`,
    });

    return NextResponse.json(job, { status: 201 });
  } catch (err) {
    console.error("[POST job]", err);
    return NextResponse.json({ error: "Failed to create job." }, { status: 500 });
  }
}
