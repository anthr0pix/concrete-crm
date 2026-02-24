import { prisma } from "@/lib/prisma";
import PipelineBoard from "@/components/pipeline/PipelineBoard";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const jobs = await prisma.job.findMany({
    where: {
      OR: [
        { pipelineStage: { not: null } },
        { status: "LEAD", pipelineStage: null },
      ],
    },
    include: { customer: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
  });

  // Group by stage
  const stages: Record<string, typeof jobs> = {
    NEW: [],
    CONTACTED: [],
    QUOTE_SENT: [],
    FOLLOW_UP: [],
    WON: [],
    LOST: [],
  };

  for (const job of jobs) {
    const stage = job.pipelineStage || "NEW";
    if (stages[stage]) stages[stage].push(job);
  }

  // Serialize dates to ISO strings for client component
  const serialized = Object.fromEntries(
    Object.entries(stages).map(([stage, stageJobs]) => [
      stage,
      stageJobs.map((j) => ({
        id: j.id,
        title: j.title,
        serviceType: j.serviceType,
        customer: j.customer,
        createdAt: j.createdAt.toISOString(),
      })),
    ])
  );

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-6">Lead Pipeline</h1>
      <PipelineBoard initialJobs={serialized} />
    </div>
  );
}
