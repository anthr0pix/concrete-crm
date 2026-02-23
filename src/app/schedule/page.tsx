import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, User } from "lucide-react";
import { SERVICE_TYPE_LABELS } from "@/types";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from "date-fns";

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
      status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      scheduledDate: { gte: calStart, lte: calEnd },
    },
    include: { customer: { select: { firstName: true, lastName: true } } },
    orderBy: { scheduledDate: "asc" },
  });

  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const prevMonth = viewMonth === 0 ? { m: 11, y: viewYear - 1 } : { m: viewMonth - 1, y: viewYear };
  const nextMonth = viewMonth === 11 ? { m: 0, y: viewYear + 1 } : { m: viewMonth + 1, y: viewYear };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <Link href="/jobs/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Job</Button>
        </Link>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/schedule?month=${prevMonth.m}&year=${prevMonth.y}`}>
          <Button variant="outline" size="sm">← Prev</Button>
        </Link>
        <h2 className="text-lg font-semibold min-w-40 text-center">
          {format(monthStart, "MMMM yyyy")}
        </h2>
        <Link href={`/schedule?month=${nextMonth.m}&year=${nextMonth.y}`}>
          <Button variant="outline" size="sm">Next →</Button>
        </Link>
      </div>

      {/* Calendar grid */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">{d}</div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7">
          {calDays.map((day) => {
            const dayJobs = jobs.filter((j) => j.scheduledDate && isSameDay(new Date(j.scheduledDate), day));
            const isCurrentMonth = day.getMonth() === viewMonth;
            const isToday = isSameDay(day, now);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 border-r border-b p-1.5 ${!isCurrentMonth ? "bg-slate-50" : ""}`}
              >
                <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                  isToday ? "bg-slate-900 text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-300"
                }`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayJobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="bg-blue-100 text-blue-800 text-xs rounded px-1.5 py-0.5 truncate hover:bg-blue-200 transition-colors cursor-pointer">
                        {job.customer.firstName} {job.customer.lastName}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming list */}
      <div className="mt-6">
        <h2 className="font-semibold text-lg mb-3">This Month&apos;s Jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-400">No jobs scheduled this month</p>
        ) : (
          <div className="space-y-2">
            {jobs
              .filter((j) => j.scheduledDate && new Date(j.scheduledDate) >= monthStart && new Date(j.scheduledDate) <= monthEnd)
              .map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
                    <div>
                      <p className="font-medium text-sm">{job.title}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{job.customer.firstName} {job.customer.lastName}</span>
                        <span>{SERVICE_TYPE_LABELS[job.serviceType]}</span>
                        {(job.city || job.address) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.city ?? job.address}</span>}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{job.scheduledDate ? format(new Date(job.scheduledDate), "MMM d") : ""}</p>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
