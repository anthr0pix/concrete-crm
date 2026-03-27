"use client";

import { useDroppable } from "@dnd-kit/core";
import PipelineCard from "./PipelineCard";
import type { PipelineJob } from "./PipelineBoard";
import { formatCurrency } from "@/lib/utils";

const COLUMN_COLORS: Record<
  string,
  { border: string; bg: string; badge: string; dropBg: string }
> = {
  LEAD: {
    border: "border-t-slate-400",
    bg: "bg-status-neutral-bg",
    badge: "bg-status-neutral-bg text-status-neutral-text",
    dropBg: "bg-muted",
  },
  CONTACTED: {
    border: "border-t-sky-400",
    bg: "bg-status-info-bg",
    badge: "bg-status-info-bg text-status-info-text",
    dropBg: "bg-muted",
  },
  QUOTED: {
    border: "border-t-blue-400",
    bg: "bg-status-info-bg",
    badge: "bg-status-info-bg text-status-info-text",
    dropBg: "bg-muted",
  },
  SCHEDULED: {
    border: "border-t-yellow-400",
    bg: "bg-status-warning-bg",
    badge: "bg-status-warning-bg text-status-warning-text",
    dropBg: "bg-muted",
  },
  IN_PROGRESS: {
    border: "border-t-orange-400",
    bg: "bg-status-orange-bg",
    badge: "bg-status-orange-bg text-status-orange-text",
    dropBg: "bg-muted",
  },
  COMPLETED: {
    border: "border-t-green-400",
    bg: "bg-status-success-bg",
    badge: "bg-status-success-bg text-status-success-text",
    dropBg: "bg-muted",
  },
  CANCELLED: {
    border: "border-t-red-400",
    bg: "bg-status-danger-bg",
    badge: "bg-status-danger-bg text-status-danger-text",
    dropBg: "bg-muted",
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
  const totalRevenue = jobs.reduce((sum, j) => sum + (j.quoteTotal ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] rounded-xl border border-border border-t-4 ${
        colors.border
      } ${isOver ? colors.dropBg : "bg-card"} transition-colors`}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <div className="flex items-center gap-1.5">
          {totalRevenue > 0 && (
            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
              {formatCurrency(totalRevenue, false)}
            </span>
          )}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}
          >
            {jobs.length}
          </span>
        </div>
      </div>

      {/* Scrollable job list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-220px)]">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Drag jobs here
          </div>
        ) : (
          jobs.map((job) => <PipelineCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
