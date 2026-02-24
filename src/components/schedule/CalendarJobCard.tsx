"use client";

import { useDraggable } from "@dnd-kit/core";
import { SERVICE_TYPE_LABELS } from "@/types";
import Link from "next/link";

const SERVICE_TYPE_COLORS: Record<string, string> = {
  CONCRETE_SEALING: "bg-blue-100 text-blue-800",
  PAVER_SEALING: "bg-purple-100 text-purple-800",
  DRIVEWAY_SEALING: "bg-green-100 text-green-800",
  PATIO_SEALING: "bg-amber-100 text-amber-800",
  POOL_DECK_SEALING: "bg-cyan-100 text-cyan-800",
  COMMERCIAL_SEALING: "bg-orange-100 text-orange-800",
  OTHER: "bg-slate-100 text-slate-800",
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
        className="rounded px-1.5 py-0.5 text-xs opacity-30 bg-slate-100"
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
