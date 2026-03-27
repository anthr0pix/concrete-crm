"use client";

import { useDraggable } from "@dnd-kit/core";
import { STATUS_COLORS, SERVICE_TYPE_LABELS, JOB_STATUS_LABELS } from "@/types";
import Link from "next/link";
import type { CalendarJob } from "./types";

interface ScheduleCardProps {
  job: CalendarJob;
  variant: "compact" | "full";
  isDragDisabled?: boolean;
}

export default function ScheduleCard({
  job,
  variant,
  isDragDisabled,
}: ScheduleCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: job.id,
      data: { job },
      disabled: isDragDisabled,
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const colorClass = STATUS_COLORS[job.status] || STATUS_COLORS.LEAD;
  const customerName = `${job.customer.firstName} ${job.customer.lastName}`;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        className="rounded px-1.5 py-0.5 text-xs opacity-30 bg-muted"
      >
        <span className="truncate block">{customerName}</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className={`${colorClass} rounded px-1.5 py-0.5 text-xs cursor-grab active:cursor-grabbing shadow-sm hover:shadow transition-shadow`}
      >
        <Link
          href={`/jobs/${job.id}`}
          onClick={(e) => {
            if (isDragging) e.preventDefault();
          }}
          className="block"
        >
          <span className="block truncate font-medium">{job.title}</span>
          <span className="block truncate text-[10px] opacity-80">
            {customerName}
          </span>
          {job.city && (
            <span className="block truncate text-[10px] opacity-65">
              {job.city}
            </span>
          )}
        </Link>
      </div>
    );
  }

  // Full variant — used in sidebar and day view
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isDragDisabled ? {} : { ...listeners, ...attributes })}
      className={`border rounded-xl p-3 bg-card ${
        isDragDisabled ? "" : "cursor-grab active:cursor-grabbing"
      } shadow-sm hover:shadow transition-shadow`}
    >
      <Link
        href={`/jobs/${job.id}`}
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
        className="block"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate">{job.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {customerName}
            </p>
            {job.city && (
              <p className="text-xs text-muted-foreground truncate">
                {job.city}
              </p>
            )}
          </div>
          <span
            className={`${colorClass} text-[10px] font-medium rounded px-1.5 py-0.5 whitespace-nowrap`}
          >
            {JOB_STATUS_LABELS[job.status] || job.status}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {SERVICE_TYPE_LABELS[job.serviceType] || job.serviceType}
        </p>
      </Link>
    </div>
  );
}
