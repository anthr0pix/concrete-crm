"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  format,
  startOfWeek,
  eachDayOfInterval,
  addDays,
  isSameDay,
  parseISO,
  isToday,
} from "date-fns";
import ScheduleCard from "./ScheduleCard";
import type { CalendarJob } from "./types";

interface WeekViewProps {
  jobs: CalendarJob[];
  currentDate: string;
  onDayClick: (dateStr: string) => void;
}

function DroppableWeekDay({
  date,
  dayJobs,
  onDayClick,
}: {
  date: Date;
  dayJobs: CalendarJob[];
  onDayClick: (dateStr: string) => void;
}) {
  const dateStr = format(date, "yyyy-MM-dd");
  const today = isToday(date);
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] border-r last:border-r-0 border-border p-1.5 transition-colors ${
        today ? "bg-[var(--mws-navy)]/[0.02]" : ""
      } ${isOver ? "bg-accent ring-2 ring-inset ring-ring" : ""}`}
    >
      <button
        onClick={() => onDayClick(dateStr)}
        className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 hover:bg-muted transition-colors ${
          today ? "bg-[var(--mws-navy)] text-white" : "text-foreground"
        }`}
      >
        {format(date, "d")}
      </button>
      <div className="space-y-0.5">
        {dayJobs.map((job) => (
          <ScheduleCard key={job.id} job={job} variant="compact" />
        ))}
        {dayJobs.length === 0 && (
          <p className="text-[10px] text-muted-foreground/50 text-center pt-2">
            No jobs
          </p>
        )}
      </div>
    </div>
  );
}

export default function WeekView({
  jobs,
  currentDate,
  onDayClick,
}: WeekViewProps) {
  const base = parseISO(currentDate);
  const weekStart = startOfWeek(base);
  const days = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const getJobsForDate = (date: Date) =>
    jobs.filter(
      (j) => j.scheduledDate && isSameDay(parseISO(j.scheduledDate), date)
    );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`text-center py-2 ${
              isToday(day) ? "bg-[var(--mws-navy)]/[0.02]" : ""
            }`}
          >
            <div className="text-xs text-muted-foreground">
              {format(day, "EEE")}
            </div>
          </div>
        ))}
      </div>
      {/* Day columns */}
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <DroppableWeekDay
            key={day.toISOString()}
            date={day}
            dayJobs={getJobsForDate(day)}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
}
