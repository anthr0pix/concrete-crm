import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import EnhancedCalendar from "@/components/schedule/EnhancedCalendar";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const { month, year } = await searchParams;
  const now = new Date();
  const viewYear = year ? parseInt(year) : now.getFullYear();
  const viewMonth = month ? parseInt(month) : now.getMonth();

  const monthStart = startOfMonth(new Date(viewYear, viewMonth));
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const jobs = await prisma.job.findMany({
    where: {
      status: { in: ["LEAD", "QUOTED", "SCHEDULED", "IN_PROGRESS"] },
      scheduledDate: { gte: calStart, lte: calEnd },
    },
    include: { customer: { select: { firstName: true, lastName: true } } },
    orderBy: { scheduledDate: "asc" },
  });

  const serializedJobs = jobs.map((j) => ({
    ...j,
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
    scheduledDate: j.scheduledDate?.toISOString() ?? null,
    completedDate: j.completedDate?.toISOString() ?? null,
    resealDueDate: j.resealDueDate?.toISOString() ?? null,
  }));

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-slate-500 mt-0.5 hidden md:block">Drag jobs to a different day to reschedule them.</p>
        </div>
        <Link href="/jobs/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Job</Button>
        </Link>
      </div>
      <EnhancedCalendar
        jobs={serializedJobs}
        initialYear={viewYear}
        initialMonth={viewMonth}
      />
    </div>
  );
}
