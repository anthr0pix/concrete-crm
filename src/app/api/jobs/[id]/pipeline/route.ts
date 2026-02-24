import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const PIPELINE_STAGES = ["NEW", "CONTACTED", "QUOTE_SENT", "FOLLOW_UP", "WON", "LOST"] as const;

const pipelineUpdateSchema = z.object({
  pipelineStage: z.enum(PIPELINE_STAGES),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = pipelineUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        pipelineStage: parsed.data.pipelineStage,
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Pipeline PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update pipeline stage" },
      { status: 500 }
    );
  }
}
