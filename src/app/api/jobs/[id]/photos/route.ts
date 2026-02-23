import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const photoSchema = z.object({
  url: z.string().url(),
  caption: z.string().optional(),
  isBefore: z.boolean().default(true),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = photoSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const photo = await prisma.jobPhoto.create({
    data: { ...parsed.data, jobId: id },
  });
  return NextResponse.json(photo, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get("photoId");
  if (!photoId) return NextResponse.json({ error: "photoId required" }, { status: 400 });

  await prisma.jobPhoto.delete({ where: { id: photoId } });
  return NextResponse.json({ success: true });
}
