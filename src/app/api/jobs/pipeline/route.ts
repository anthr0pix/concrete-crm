import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

const PIPELINE_STAGES = ["NEW", "CONTACTED", "QUOTE_SENT", "FOLLOW_UP", "WON", "LOST"] as const;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch jobs that have a pipelineStage set
    const pipelineJobs = await prisma.job.findMany({
      where: {
        pipelineStage: { not: null },
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch LEAD/QUOTED jobs without a pipelineStage (auto-map them)
    const unmappedJobs = await prisma.job.findMany({
      where: {
        pipelineStage: null,
        status: { in: ["LEAD", "QUOTED"] },
      },
      include: {
        customer: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Initialize all stages
    const stages: Record<string, typeof pipelineJobs> = {};
    for (const stage of PIPELINE_STAGES) {
      stages[stage] = [];
    }

    // Group pipeline jobs by stage
    for (const job of pipelineJobs) {
      const stage = job.pipelineStage as string;
      if (stages[stage]) {
        stages[stage].push(job);
      }
    }

    // Auto-map unmapped LEAD jobs to NEW, QUOTED jobs to QUOTE_SENT
    for (const job of unmappedJobs) {
      if (job.status === "LEAD") {
        stages["NEW"].push(job);
      } else if (job.status === "QUOTED") {
        stages["QUOTE_SENT"].push(job);
      }
    }

    return NextResponse.json({ stages });
  } catch (error) {
    console.error("Pipeline GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipeline data" },
      { status: 500 }
    );
  }
}
