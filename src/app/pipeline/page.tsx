import { prisma } from "@/lib/prisma";
import PipelineBoard from "@/components/pipeline/PipelineBoard";

export const dynamic = "force-dynamic";

const STATUSES = ["LEAD", "QUOTED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;

export default async function PipelinePage() {
  const jobs = await prisma.job.findMany({
    include: {
      customer: { select: { firstName: true, lastName: true } },
      quotes: { select: { total: true }, orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by status
  const grouped: Record<string, typeof jobs> = {};
  for (const s of STATUSES) grouped[s] = [];
  for (const job of jobs) {
    if (grouped[job.status]) grouped[job.status].push(job);
  }

  // Serialize for client component
  const serialized = Object.fromEntries(
    Object.entries(grouped).map(([status, statusJobs]) => [
      status,
      statusJobs.map((j) => ({
        id: j.id,
        title: j.title,
        serviceType: j.serviceType,
        customer: j.customer,
        createdAt: j.createdAt.toISOString(),
        scheduledDate: j.scheduledDate?.toISOString() ?? null,
        quoteTotal: j.quotes[0]?.total ?? null,
      })),
    ])
  );

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-1">Job Board</h1>
      <p className="text-sm text-slate-500 mb-6">Drag and drop jobs between stages to update their status.</p>
      <PipelineBoard initialJobs={serialized} />
    </div>
  );
}
