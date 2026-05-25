import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logActivity } from "@/lib/activity";

const noteSchema = z.object({
  customerId: z.string().min(1),
  jobId: z.string().optional(),
  content: z.string().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = noteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { customerId, jobId, content } = parsed.data;

    await logActivity({
      type: "NOTE_ADDED",
      customerId,
      jobId,
      description: content,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[activities/notes] POST error:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
