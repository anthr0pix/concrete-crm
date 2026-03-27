import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ScheduleView from "@/components/schedule/ScheduleView";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  parseISO,
  format,
} from "date-fns";

export const dynamic = "force-dynamic";

type ViewType = "week" | "month" | "day";

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: viewParam, date: dateParam } = await searchParams;

  const validViews: ViewType[] = ["week", "month", "day"];
  const view: ViewType = validViews.includes(viewParam as ViewType)
    ? (viewParam as ViewType)
    : "week";

  const currentDate = dateParam || format(new Date(), "yyyy-MM-dd");
  const baseDate = parseISO(currentDate);

  // Compute date range based on view
  let rangeStart: Date;
  let rangeEnd: Date;

  switch (view) {
    case "week":
      rangeStart = startOfWeek(baseDate);
      rangeEnd = endOfWeek(baseDate);
      break;
    case "month": {
      const monthStart = startOfMonth(baseDate);
      const monthEnd = endOfMonth(baseDate);
      rangeStart = startOfWeek(monthStart);
      rangeEnd = endOfWeek(monthEnd);
      break;
    }
    case "day":
      rangeStart = startOfDay(baseDate);
      rangeEnd = endOfDay(baseDate);
      break;
  }

  const selectFields = {
    id: true,
    title: true,
    serviceType: true,
    status: true,
    scheduledDate: true,
    createdAt: true,
    address: true,
    city: true,
    state: true,
    zip: true,
    customer: { select: { firstName: true, lastName: true, phone: true } },
  };

  const [scheduledJobs, unscheduledJobs] = await Promise.all([
    prisma.job.findMany({
      where: {
        status: { in: ["LEAD", "CONTACTED", "QUOTED", "SCHEDULED", "IN_PROGRESS"] },
        scheduledDate: { gte: rangeStart, lte: rangeEnd },
      },
      select: selectFields,
      orderBy: { scheduledDate: "asc" },
    }),
    view !== "day"
      ? prisma.job.findMany({
          where: {
            scheduledDate: null,
            status: { in: ["LEAD", "CONTACTED", "QUOTED", "SCHEDULED"] },
          },
          select: selectFields,
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
  ]);

  const serialize = (jobs: typeof scheduledJobs) =>
    jobs.map((j) => ({
      ...j,
      scheduledDate: j.scheduledDate?.toISOString() ?? null,
      createdAt: j.createdAt.toISOString(),
    }));

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <div>
          <h1 className="text-2xl font-bold">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1 hidden md:block">
            Drag jobs to reschedule. Drag unscheduled jobs onto a day to
            schedule them.
          </p>
        </div>
        <Link href="/jobs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Job
          </Button>
        </Link>
      </div>
      <ScheduleView
        scheduledJobs={serialize(scheduledJobs)}
        unscheduledJobs={serialize(unscheduledJobs)}
        initialView={view}
        initialDate={currentDate}
      />
    </div>
  );
}
