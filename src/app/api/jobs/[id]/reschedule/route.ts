import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const rescheduleSchema = z.object({
  scheduledDate: z.string().min(1),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = rescheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const job = await prisma.job.update({
      where: { id },
      data: {
        scheduledDate: new Date(parsed.data.scheduledDate),
      },
    });
    return NextResponse.json(job);
  } catch (err) {
    console.error("Reschedule error:", err);
    return NextResponse.json(
      { error: "Failed to reschedule job" },
      { status: 500 }
    );
  }
}
