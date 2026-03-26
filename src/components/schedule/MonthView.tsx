"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  isToday,
} from "date-fns";
import ScheduleCard from "./ScheduleCard";
import type { CalendarJob } from "./types";

interface MonthViewProps {
  jobs: CalendarJob[];
  currentDate: string;
  onDayClick: (dateStr: string) => void;
}

function DroppableMonthDay({
  date,
  isCurrentMonth,
  dayJobs,
  onDayClick,
}: {
  date: Date;
  isCurrentMonth: boolean;
  dayJobs: CalendarJob[];
  onDayClick: (dateStr: string) => void;
}) {
  const dateStr = format(date, "yyyy-MM-dd");
  const today = isToday(date);
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-24 border-r border-b border-border p-1.5 transition-colors ${
        !isCurrentMonth ? "bg-muted" : ""
      } ${isOver ? "bg-accent ring-2 ring-inset ring-ring" : ""}`}
    >
      <button
        onClick={() => onDayClick(dateStr)}
        className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 hover:bg-muted transition-colors ${
          today
            ? "bg-[var(--mws-navy)] text-white"
            : isCurrentMonth
              ? "text-foreground"
              : "text-muted-foreground"
        }`}
      >
        {format(date, "d")}
      </button>
      <div className="space-y-0.5">
        {dayJobs.map((job) => (
          <ScheduleCard key={job.id} job={job} variant="compact" />
        ))}
      </div>
    </div>
  );
}

export default function MonthView({
  jobs,
  currentDate,
  onDayClick,
}: MonthViewProps) {
  const base = parseISO(currentDate);
  const monthStart = startOfMonth(base);
  const monthEnd = endOfMonth(base);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });
  const currentMonthNum = monthStart.getMonth();

  const getJobsForDate = (date: Date) =>
    jobs.filter(
      (j) => j.scheduledDate && isSameDay(parseISO(j.scheduledDate), date)
    );

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Calendar cells */}
      <div className="grid grid-cols-7">
        {calDays.map((day) => (
          <DroppableMonthDay
            key={day.toISOString()}
            date={day}
            isCurrentMonth={day.getMonth() === currentMonthNum}
            dayJobs={getJobsForDate(day)}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
}
