import { prisma } from "@/lib/prisma";
import CrewDayView from "@/components/crew/CrewDayView";

export const dynamic = "force-dynamic";

export default async function CrewPage() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const jobs = await prisma.job.findMany({
    where: {
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      scheduledDate: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    orderBy: { scheduledDate: "asc" },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          address: true,
          city: true,
          state: true,
          zip: true,
        },
      },
      _count: { select: { photos: true } },
    },
  });

  // Extract distinct crew assignments for the filter
  const crews = [...new Set(
    jobs
      .map((j) => j.crewAssignment)
      .filter((c): c is string => c !== null && c !== "")
  )].sort();

  // Serialize dates to strings for client component
  const serializedJobs = jobs.map((job) => ({
    ...job,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    scheduledDate: job.scheduledDate?.toISOString() ?? null,
    completedDate: job.completedDate?.toISOString() ?? null,
    resealDueDate: job.resealDueDate?.toISOString() ?? null,
    reviewRequestSentAt: job.reviewRequestSentAt?.toISOString() ?? null,
    resealReminderSentAt: job.resealReminderSentAt?.toISOString() ?? null,
  }));

  return <CrewDayView jobs={serializedJobs} crews={crews} />;
}
