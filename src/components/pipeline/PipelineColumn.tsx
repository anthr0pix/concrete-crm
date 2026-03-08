"use client";

import { useDroppable } from "@dnd-kit/core";
import PipelineCard from "./PipelineCard";
import type { PipelineJob } from "./PipelineBoard";

const COLUMN_COLORS: Record<
  string,
  { border: string; bg: string; badge: string; dropBg: string }
> = {
  LEAD: {
    border: "border-t-slate-400",
    bg: "bg-slate-50",
    badge: "bg-slate-100 text-slate-700",
    dropBg: "bg-slate-100",
  },
  QUOTED: {
    border: "border-t-blue-400",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    dropBg: "bg-blue-100",
  },
  SCHEDULED: {
    border: "border-t-yellow-400",
    bg: "bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-700",
    dropBg: "bg-yellow-100",
  },
  IN_PROGRESS: {
    border: "border-t-orange-400",
    bg: "bg-orange-50",
    badge: "bg-orange-100 text-orange-700",
    dropBg: "bg-orange-100",
  },
  COMPLETED: {
    border: "border-t-green-400",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-700",
    dropBg: "bg-green-100",
  },
  CANCELLED: {
    border: "border-t-red-400",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700",
    dropBg: "bg-red-100",
  },
};

export default function PipelineColumn({
  status,
  label,
  jobs,
}: {
  status: string;
  label: string;
  jobs: PipelineJob[];
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  const colors = COLUMN_COLORS[status] || COLUMN_COLORS.LEAD;

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] rounded-lg border border-slate-200 border-t-4 ${
        colors.border
      } ${isOver ? colors.dropBg : "bg-white"} transition-colors`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}
        >
          {jobs.length}
        </span>
      </div>

      {/* Scrollable job list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-220px)]">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Drag jobs here
          </div>
        ) : (
          jobs.map((job) => <PipelineCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
