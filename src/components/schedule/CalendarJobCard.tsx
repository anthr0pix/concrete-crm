"use client";

import { useDraggable } from "@dnd-kit/core";
import { SERVICE_TYPE_LABELS } from "@/types";
import Link from "next/link";

const SERVICE_TYPE_COLORS: Record<string, string> = {
  CONCRETE_SEALING: "bg-status-info-bg text-status-info-text",
  PAVER_SEALING: "bg-status-purple-bg text-status-purple-text",
  DRIVEWAY_SEALING: "bg-status-success-bg text-status-success-text",
  PATIO_SEALING: "bg-status-amber-bg text-status-amber-text",
  POOL_DECK_SEALING: "bg-status-info-bg text-status-info-text",
  COMMERCIAL_SEALING: "bg-status-orange-bg text-status-orange-text",
  OTHER: "bg-status-neutral-bg text-status-neutral-text",
};

interface CalendarJobCardProps {
  job: {
    id: string;
    title: string;
    serviceType: string;
    customer: { firstName: string; lastName: string };
    city?: string | null;
  };
}

export default function CalendarJobCard({ job }: CalendarJobCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: job.id,
      data: { job },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const colorClass =
    SERVICE_TYPE_COLORS[job.serviceType] || SERVICE_TYPE_COLORS.OTHER;

  if (isDragging) {
    // Render a faded placeholder while dragging (the overlay shows the real card)
    return (
      <div
        ref={setNodeRef}
        className="rounded px-1.5 py-0.5 text-xs opacity-30 bg-muted"
      >
        <span className="truncate block">
          {job.customer.firstName} {job.customer.lastName}
        </span>
      </div>
    );
  }

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
          // Prevent navigation if we were dragging
          if (isDragging) {
            e.preventDefault();
          }
        }}
        className="block truncate"
      >
        {job.customer.firstName} {job.customer.lastName}
      </Link>
      <span className="block truncate text-[10px] opacity-75">
        {SERVICE_TYPE_LABELS[job.serviceType] || job.serviceType}
      </span>
    </div>
  );
}
