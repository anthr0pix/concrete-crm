"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { SERVICE_TYPE_LABELS } from "@/types";
import { format } from "date-fns";
import type { PipelineJob } from "./PipelineBoard";

export default function PipelineCard({ job }: { job: PipelineJob }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-sm ${
        isDragging ? "opacity-50 shadow-md" : ""
      }`}
    >
      <Link href={`/jobs/${job.id}`} className="block" onClick={(e) => { if (isDragging) e.preventDefault(); }}>
        <p className="font-semibold text-sm text-foreground truncate">
          {job.customer.firstName} {job.customer.lastName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{job.title}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {SERVICE_TYPE_LABELS[job.serviceType] || job.serviceType}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-muted-foreground">
            {job.scheduledDate
              ? format(new Date(job.scheduledDate), "MMM d, yyyy")
              : format(new Date(job.createdAt), "MMM d, yyyy")}
          </span>
          {job.quoteTotal !== null && job.quoteTotal > 0 && (
            <span className="text-xs font-semibold text-foreground">
              ${job.quoteTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
