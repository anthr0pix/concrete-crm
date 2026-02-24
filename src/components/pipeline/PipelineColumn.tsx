"use client";

import { useDroppable } from "@dnd-kit/core";
import PipelineCard from "./PipelineCard";

interface PipelineJob {
  id: string;
  title: string;
  serviceType: string;
  customer: { firstName: string; lastName: string };
  total?: number;
  createdAt: string;
}

const COLUMN_COLORS: Record<
  string,
  { border: string; bg: string; badge: string; dropBg: string }
> = {
  NEW: {
    border: "border-t-slate-400",
    bg: "bg-slate-50",
    badge: "bg-slate-100 text-slate-700",
    dropBg: "bg-slate-100",
  },
  CONTACTED: {
    border: "border-t-blue-400",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    dropBg: "bg-blue-100",
  },
  QUOTE_SENT: {
    border: "border-t-purple-400",
    bg: "bg-purple-50",
    badge: "bg-purple-100 text-purple-700",
    dropBg: "bg-purple-100",
  },
  FOLLOW_UP: {
    border: "border-t-amber-400",
    bg: "bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    dropBg: "bg-amber-100",
  },
  WON: {
    border: "border-t-green-400",
    bg: "bg-green-50",
    badge: "bg-green-100 text-green-700",
    dropBg: "bg-green-100",
  },
  LOST: {
    border: "border-t-red-400",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700",
    dropBg: "bg-red-100",
  },
};

export default function PipelineColumn({
  stage,
  label,
  jobs,
}: {
  stage: string;
  label: string;
  jobs: PipelineJob[];
  color?: string;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });

  const colors = COLUMN_COLORS[stage] || COLUMN_COLORS.NEW;

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
            No leads
          </div>
        ) : (
          jobs.map((job) => <PipelineCard key={job.id} job={job} />)
        )}
      </div>
    </div>
  );
}
