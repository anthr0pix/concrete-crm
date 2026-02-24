"use client";

import { useDraggable } from "@dnd-kit/core";
import { SERVICE_TYPE_LABELS } from "@/types";
import { format } from "date-fns";

interface PipelineJob {
  id: string;
  title: string;
  serviceType: string;
  customer: { firstName: string; lastName: string };
  total?: number;
  createdAt: string;
}

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
      className={`bg-white border border-slate-200 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-sm ${
        isDragging ? "opacity-50 shadow-md" : ""
      }`}
    >
      <p className="font-semibold text-sm text-slate-900 truncate">
        {job.customer.firstName} {job.customer.lastName}
      </p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">{job.title}</p>
      <div className="flex items-center gap-2 mt-2">
        <span className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
          {SERVICE_TYPE_LABELS[job.serviceType] || job.serviceType}
        </span>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-slate-400">
          {format(new Date(job.createdAt), "MMM d, yyyy")}
        </span>
        {job.total !== undefined && job.total > 0 && (
          <span className="text-xs font-semibold text-slate-700">
            ${job.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </div>
  );
}
