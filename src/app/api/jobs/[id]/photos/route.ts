import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logActivity } from "@/lib/activity";

const photoSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
  isBefore: z.boolean().default(true),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = photoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const job = await prisma.job.findUnique({ where: { id }, select: { id: true, customerId: true } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const photo = await prisma.jobPhoto.create({
      data: { ...parsed.data, jobId: id },
    });

    logActivity({
      type: "PHOTO_UPLOADED",
      customerId: job.customerId,
      jobId: id,
      description: `Photo uploaded (${parsed.data.isBefore ? "before" : "after"})`,
    });

    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    console.error("[POST photos]", err);
    return NextResponse.json({ error: "Failed to add photo." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get("photoId");
  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  try {
    // Verify photo belongs to this job — prevents IDOR
    const photo = await prisma.jobPhoto.findFirst({ where: { id: photoId, jobId: id } });
    if (!photo) return NextResponse.json({ error: "Photo not found" }, { status: 404 });

    await prisma.jobPhoto.delete({ where: { id: photoId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE photo]", err);
    return NextResponse.json({ error: "Failed to delete photo." }, { status: 500 });
  }
}
