"use client";

import { PanelRightClose, PanelRightOpen } from "lucide-react";
import ScheduleCard from "./ScheduleCard";
import type { CalendarJob } from "./types";

interface UnscheduledSidebarProps {
  jobs: CalendarJob[];
  open: boolean;
  onToggle: () => void;
}

export default function UnscheduledSidebar({
  jobs,
  open,
  onToggle,
}: UnscheduledSidebarProps) {
  if (!open) {
    return (
      <div className="w-10 flex-shrink-0">
        <button
          onClick={onToggle}
          className="sticky top-4 flex flex-col items-center gap-1.5 p-2 rounded-xl border bg-card hover:bg-accent transition-colors"
          title="Show unscheduled jobs"
        >
          <PanelRightOpen className="w-4 h-4" />
          {jobs.length > 0 && (
            <span className="bg-[#e94560] text-white text-[10px] font-medium rounded-full w-5 h-5 flex items-center justify-center">
              {jobs.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 flex-shrink-0">
      <div className="sticky top-4 border rounded-xl bg-card">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Needs Scheduling</h3>
            {jobs.length > 0 && (
              <span className="bg-[#e94560] text-white text-[10px] font-medium rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {jobs.length}
              </span>
            )}
          </div>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-muted transition-colors"
            title="Hide sidebar"
          >
            <PanelRightClose className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="p-2 max-h-[calc(100vh-280px)] overflow-y-auto space-y-2">
          {jobs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              All jobs are scheduled
            </p>
          ) : (
            jobs.map((job) => (
              <ScheduleCard key={job.id} job={job} variant="full" />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
