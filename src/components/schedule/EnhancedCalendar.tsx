"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from "@dnd-kit/core";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
} from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CalendarJobCard from "./CalendarJobCard";
import Link from "next/link";
import { SERVICE_TYPE_LABELS, JOB_STATUS_LABELS } from "@/types";

const SERVICE_TYPE_COLORS: Record<string, string> = {
  CONCRETE_SEALING: "bg-blue-100 text-blue-800",
  PAVER_SEALING: "bg-purple-100 text-purple-800",
  DRIVEWAY_SEALING: "bg-green-100 text-green-800",
  PATIO_SEALING: "bg-amber-100 text-amber-800",
  POOL_DECK_SEALING: "bg-cyan-100 text-cyan-800",
  COMMERCIAL_SEALING: "bg-orange-100 text-orange-800",
  OTHER: "bg-slate-100 text-slate-800",
};

interface CalendarJob {
  id: string;
  title: string;
  serviceType: string;
  scheduledDate: string | null;
  status: string;
  customer: { firstName: string; lastName: string };
  city?: string | null;
}

interface EnhancedCalendarProps {
  jobs: CalendarJob[];
  initialYear: number;
  initialMonth: number;
}

function DroppableDay({
  date,
  isCurrentMonth,
  isToday,
  dayJobs,
}: {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  dayJobs: CalendarJob[];
}) {
  const dateStr = format(date, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-24 border-r border-b p-1.5 transition-colors ${
        !isCurrentMonth ? "bg-slate-50" : ""
      } ${isOver ? "bg-blue-50 ring-2 ring-inset ring-blue-300" : ""}`}
    >
      <div
        className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
          isToday
            ? "bg-[#1a1a2e] text-white"
            : isCurrentMonth
              ? "text-slate-700"
              : "text-slate-300"
        }`}
      >
        {format(date, "d")}
      </div>
      <div className="space-y-0.5">
        {dayJobs.map((job) => (
          <CalendarJobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

export default function EnhancedCalendar({
  jobs: initialJobs,
  initialYear,
  initialMonth,
}: EnhancedCalendarProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState<CalendarJob[]>(initialJobs);
  const [activeJob, setActiveJob] = useState<CalendarJob | null>(null);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const monthStart = startOfMonth(new Date(currentYear, currentMonth));
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const now = new Date();

  const goToPrevMonth = useCallback(() => {
    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    router.push(`/schedule?month=${newMonth}&year=${newYear}`);
  }, [currentMonth, currentYear, router]);

  const goToNextMonth = useCallback(() => {
    const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    router.push(`/schedule?month=${newMonth}&year=${newYear}`);
  }, [currentMonth, currentYear, router]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const draggedJob = jobs.find((j) => j.id === event.active.id);
      setActiveJob(draggedJob ?? null);
    },
    [jobs]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveJob(null);
      const { active, over } = event;

      if (!over) return;

      const jobId = active.id as string;
      const newDateStr = over.id as string;

      // Find the job
      const job = jobs.find((j) => j.id === jobId);
      if (!job || !job.scheduledDate) return;

      // Check if dropped on the same date
      const oldDate = format(parseISO(job.scheduledDate), "yyyy-MM-dd");
      if (oldDate === newDateStr) return;

      // Build the new scheduled date, preserving time
      const newDate = new Date(newDateStr + "T12:00:00");

      // Optimistic update
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId ? { ...j, scheduledDate: newDate.toISOString() } : j
        )
      );

      try {
        const res = await fetch(`/api/jobs/${jobId}/reschedule`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledDate: newDate.toISOString() }),
        });

        if (!res.ok) {
          throw new Error("Failed to reschedule");
        }

        toast.success(
          `Rescheduled ${job.customer.firstName} ${job.customer.lastName} to ${format(newDate, "MMM d")}`
        );
      } catch {
        // Revert optimistic update
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, scheduledDate: job.scheduledDate } : j
          )
        );
        toast.error("Failed to reschedule job. Please try again.");
      }
    },
    [jobs]
  );

  const getJobsForDate = useCallback(
    (date: Date) => {
      return jobs.filter(
        (j) => j.scheduledDate && isSameDay(parseISO(j.scheduledDate), date)
      );
    },
    [jobs]
  );

  // Mobile list: jobs sorted by date for the current month
  const monthJobs = jobs
    .filter((j) => {
      if (!j.scheduledDate) return false;
      const d = parseISO(j.scheduledDate);
      return d >= monthStart && d <= monthEnd;
    })
    .sort((a, b) => {
      if (!a.scheduledDate || !b.scheduledDate) return 0;
      return (
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime()
      );
    });

  const overlayColorClass = activeJob
    ? SERVICE_TYPE_COLORS[activeJob.serviceType] || SERVICE_TYPE_COLORS.OTHER
    : "";

  const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();

  const goToToday = useCallback(() => {
    const todayMonth = now.getMonth();
    const todayYear = now.getFullYear();
    setCurrentMonth(todayMonth);
    setCurrentYear(todayYear);
    router.push(`/schedule?month=${todayMonth}&year=${todayYear}`);
  }, [now, router]);

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={goToPrevMonth}>
          <ChevronLeft className="w-4 h-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <h2 className="text-lg font-semibold min-w-40 text-center">
          {format(monthStart, "MMMM yyyy")}
        </h2>
        <Button variant="outline" size="sm" onClick={goToNextMonth}>
          <ChevronRight className="w-4 h-4" />
          <span className="sr-only">Next month</span>
        </Button>
        {!isCurrentMonth && (
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-blue-600 hover:text-blue-700">
            Today
          </Button>
        )}
      </div>

      {/* Desktop: Calendar grid with DnD */}
      <div className="hidden md:block">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="bg-white border rounded-lg overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-slate-500 py-2"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7">
              {calDays.map((day) => {
                const dayJobs = getJobsForDate(day);
                const isCurrentMonth = day.getMonth() === currentMonth;
                const isToday = isSameDay(day, now);

                return (
                  <DroppableDay
                    key={day.toISOString()}
                    date={day}
                    isCurrentMonth={isCurrentMonth}
                    isToday={isToday}
                    dayJobs={dayJobs}
                  />
                );
              })}
            </div>
          </div>

          {/* Drag overlay - renders the card being dragged */}
          <DragOverlay>
            {activeJob ? (
              <div
                className={`${overlayColorClass} rounded px-1.5 py-0.5 text-xs shadow-lg cursor-grabbing opacity-90 w-32`}
              >
                <span className="block truncate">
                  {activeJob.customer.firstName} {activeJob.customer.lastName}
                </span>
                <span className="block truncate text-[10px] opacity-75">
                  {SERVICE_TYPE_LABELS[activeJob.serviceType] ||
                    activeJob.serviceType}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile: List view */}
      <div className="md:hidden">
        {monthJobs.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            No jobs scheduled this month
          </p>
        ) : (
          <div className="space-y-2">
            {monthJobs.map((job) => {
              const colorClass =
                SERVICE_TYPE_COLORS[job.serviceType] ||
                SERVICE_TYPE_COLORS.OTHER;
              return (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
                    <div>
                      <p className="font-medium text-sm">
                        {job.customer.firstName} {job.customer.lastName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`${colorClass} text-xs rounded px-1.5 py-0.5`}
                        >
                          {SERVICE_TYPE_LABELS[job.serviceType] ||
                            job.serviceType}
                        </span>
                        {job.city && (
                          <span className="text-xs text-slate-500">
                            {job.city}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">
                        {job.scheduledDate
                          ? format(parseISO(job.scheduledDate), "MMM d")
                          : ""}
                      </p>
                      <p className="text-xs text-slate-500">{JOB_STATUS_LABELS[job.status] ?? job.status}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
