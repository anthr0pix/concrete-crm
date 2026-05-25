import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["NOTE", "CALL", "EMAIL", "STATUS_CHANGE", "FOLLOW_UP"]),
  content: z.string().min(1),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor");
  const take = 20;

  try {
    const notes = await prisma.outreachNote.findMany({
      where: { propertyManagerId: id },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = notes.length > take;
    const items = hasMore ? notes.slice(0, take) : notes;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return NextResponse.json({ notes: items, nextCursor });
  } catch (error) {
    console.error("Failed to fetch outreach notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const note = await prisma.outreachNote.create({
      data: {
        propertyManagerId: id,
        type: parsed.data.type,
        content: parsed.data.content,
      },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Failed to create outreach note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 },
    );
  }
}
