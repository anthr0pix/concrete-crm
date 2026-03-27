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
} from "@dnd-kit/core";
import {
  format,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addDays,
  subDays,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  isToday as checkIsToday,
} from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { STATUS_COLORS } from "@/types";
import Link from "next/link";
import ViewToggle from "./ViewToggle";
import WeekView from "./WeekView";
import MonthView from "./MonthView";
import DayView from "./DayView";
import UnscheduledSidebar from "./UnscheduledSidebar";
import type { CalendarJob } from "./types";

type ViewType = "week" | "month" | "day";

interface ScheduleViewProps {
  scheduledJobs: CalendarJob[];
  unscheduledJobs: CalendarJob[];
  initialView: ViewType;
  initialDate: string;
}

function getNavigationTitle(view: ViewType, dateStr: string): string {
  const date = parseISO(dateStr);
  switch (view) {
    case "week": {
      const weekStart = startOfWeek(date);
      const weekEnd = endOfWeek(date);
      const startMonth = format(weekStart, "MMM d");
      const endMonth =
        weekStart.getMonth() === weekEnd.getMonth()
          ? format(weekEnd, "d, yyyy")
          : format(weekEnd, "MMM d, yyyy");
      return `${startMonth} – ${endMonth}`;
    }
    case "month":
      return format(startOfMonth(date), "MMMM yyyy");
    case "day":
      return format(date, "EEEE, MMMM d, yyyy");
  }
}

export default function ScheduleView({
  scheduledJobs,
  unscheduledJobs,
  initialView,
  initialDate,
}: ScheduleViewProps) {
  const router = useRouter();
  const [view, setView] = useState<ViewType>(initialView);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [jobs, setJobs] = useState<CalendarJob[]>(scheduledJobs);
  const [unscheduled, setUnscheduled] =
    useState<CalendarJob[]>(unscheduledJobs);
  const [activeJob, setActiveJob] = useState<CalendarJob | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const navigate = useCallback(
    (newView: ViewType, newDate: string) => {
      setView(newView);
      setCurrentDate(newDate);
      router.push(`/schedule?view=${newView}&date=${newDate}`);
    },
    [router]
  );

  const goToPrev = useCallback(() => {
    const base = parseISO(currentDate);
    let newDate: Date;
    switch (view) {
      case "week":
        newDate = subWeeks(base, 1);
        break;
      case "month":
        newDate = subMonths(base, 1);
        break;
      case "day":
        newDate = subDays(base, 1);
        break;
    }
    navigate(view, format(newDate, "yyyy-MM-dd"));
  }, [view, currentDate, navigate]);

  const goToNext = useCallback(() => {
    const base = parseISO(currentDate);
    let newDate: Date;
    switch (view) {
      case "week":
        newDate = addWeeks(base, 1);
        break;
      case "month":
        newDate = addMonths(base, 1);
        break;
      case "day":
        newDate = addDays(base, 1);
        break;
    }
    navigate(view, format(newDate, "yyyy-MM-dd"));
  }, [view, currentDate, navigate]);

  const goToToday = useCallback(() => {
    navigate(view, format(new Date(), "yyyy-MM-dd"));
  }, [view, navigate]);

  const switchView = useCallback(
    (newView: ViewType) => {
      navigate(newView, currentDate);
    },
    [currentDate, navigate]
  );

  const handleDayClick = useCallback(
    (dateStr: string) => {
      navigate("day", dateStr);
    },
    [navigate]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      const found =
        jobs.find((j) => j.id === id) ||
        unscheduled.find((j) => j.id === id);
      setActiveJob(found ?? null);
    },
    [jobs, unscheduled]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveJob(null);
      const { active, over } = event;
      if (!over) return;

      const jobId = active.id as string;
      const newDateStr = over.id as string;
      const newDate = new Date(newDateStr + "T12:00:00");

      // Check if this is from the unscheduled sidebar
      const fromUnscheduled = unscheduled.find((j) => j.id === jobId);

      if (fromUnscheduled) {
        // Move from unscheduled to scheduled
        const updatedJob: CalendarJob = {
          ...fromUnscheduled,
          scheduledDate: newDate.toISOString(),
          status: "SCHEDULED",
        };

        // Optimistic update
        setUnscheduled((prev) => prev.filter((j) => j.id !== jobId));
        setJobs((prev) => [...prev, updatedJob]);

        try {
          const res = await fetch(`/api/jobs/${jobId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scheduledDate: newDate.toISOString(),
            }),
          });

          if (!res.ok) throw new Error("Failed to schedule");

          toast.success(
            `Scheduled ${fromUnscheduled.customer.firstName} ${fromUnscheduled.customer.lastName} for ${format(newDate, "MMM d")}`
          );
        } catch {
          // Rollback
          setJobs((prev) => prev.filter((j) => j.id !== jobId));
          setUnscheduled((prev) => [...prev, fromUnscheduled]);
          toast.error("Failed to schedule job. Please try again.");
        }
        return;
      }

      // Reschedule existing job
      const job = jobs.find((j) => j.id === jobId);
      if (!job || !job.scheduledDate) return;

      const oldDate = format(parseISO(job.scheduledDate), "yyyy-MM-dd");
      if (oldDate === newDateStr) return;

      // Optimistic update
      const previousDate = job.scheduledDate;
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? { ...j, scheduledDate: newDate.toISOString() }
            : j
        )
      );

      try {
        const res = await fetch(`/api/jobs/${jobId}/reschedule`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledDate: newDate.toISOString() }),
        });

        if (!res.ok) throw new Error("Failed to reschedule");

        toast.success(
          `Rescheduled ${job.customer.firstName} ${job.customer.lastName} to ${format(newDate, "MMM d")}`
        );
      } catch {
        // Rollback
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, scheduledDate: previousDate } : j
          )
        );
        toast.error("Failed to reschedule job. Please try again.");
      }
    },
    [jobs, unscheduled]
  );

  const showToday = !checkIsToday(parseISO(currentDate));
  const overlayColorClass = activeJob
    ? STATUS_COLORS[activeJob.status] || STATUS_COLORS.LEAD
    : "";

  return (
    <div>
      {/* Desktop layout */}
      <div className="hidden md:block">
        {/* Navigation bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={goToPrev}>
              <ChevronLeft className="w-4 h-4" />
              <span className="sr-only">Previous</span>
            </Button>
            <h2 className="text-base font-semibold min-w-56 text-center">
              {getNavigationTitle(view, currentDate)}
            </h2>
            <Button variant="outline" size="sm" onClick={goToNext}>
              <ChevronRight className="w-4 h-4" />
              <span className="sr-only">Next</span>
            </Button>
            {showToday && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="text-primary hover:text-primary/80"
              >
                Today
              </Button>
            )}
          </div>
          <ViewToggle view={view} onChange={switchView} />
        </div>

        {/* Calendar + sidebar */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              {view === "week" && (
                <WeekView
                  jobs={jobs}
                  currentDate={currentDate}
                  onDayClick={handleDayClick}
                />
              )}
              {view === "month" && (
                <MonthView
                  jobs={jobs}
                  currentDate={currentDate}
                  onDayClick={handleDayClick}
                />
              )}
              {view === "day" && (
                <DayView jobs={jobs} currentDate={currentDate} />
              )}
            </div>

            {view !== "day" && (
              <UnscheduledSidebar
                jobs={unscheduled}
                open={sidebarOpen}
                onToggle={() => setSidebarOpen((o) => !o)}
              />
            )}
          </div>

          <DragOverlay>
            {activeJob ? (
              <div
                className={`${overlayColorClass} rounded px-2 py-1 text-xs shadow-lg cursor-grabbing opacity-90 w-36`}
              >
                <span className="block truncate font-medium">
                  {activeJob.title}
                </span>
                <span className="block truncate text-[10px] opacity-80">
                  {activeJob.customer.firstName} {activeJob.customer.lastName}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Mobile layout — day agenda only */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-base font-semibold text-center">
              {format(parseISO(currentDate), "EEE, MMM d")}
            </h2>
            <Button variant="outline" size="sm" onClick={goToNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {showToday && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="text-primary hover:text-primary/80"
              >
                Today
              </Button>
            )}
            {unscheduled.length > 0 && (
              <Link href="/jobs?status=LEAD">
                <Button variant="outline" size="sm">
                  <CalendarDays className="w-3.5 h-3.5 mr-1" />
                  {unscheduled.length} unscheduled
                </Button>
              </Link>
            )}
          </div>
        </div>
        <DayView jobs={jobs} currentDate={currentDate} />
      </div>
    </div>
  );
}
