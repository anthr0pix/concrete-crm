"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast } from "sonner";
import PipelineColumn from "./PipelineColumn";
import PipelineCard from "./PipelineCard";

export interface PipelineJob {
  id: string;
  title: string;
  serviceType: string;
  customer: { firstName: string; lastName: string };
  createdAt: string;
  scheduledDate: string | null;
  quoteTotal: number | null;
}

const ACTIVE_STATUSES = [
  { key: "LEAD", label: "Lead" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "QUOTED", label: "Quoted" },
  { key: "SCHEDULED", label: "Scheduled" },
  { key: "IN_PROGRESS", label: "In Progress" },
];

const CLOSED_STATUSES = [
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function PipelineBoard({
  initialJobs,
}: {
  initialJobs: Record<string, PipelineJob[]>;
}) {
  const [jobsByStatus, setJobsByStatus] =
    useState<Record<string, PipelineJob[]>>(initialJobs);
  const [activeJob, setActiveJob] = useState<PipelineJob | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const job = event.active.data.current?.job as PipelineJob | undefined;
    if (job) setActiveJob(job);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveJob(null);

      const { active, over } = event;
      if (!over) return;

      const jobId = active.id as string;
      const newStatus = over.id as string;

      // Find current status for this job
      let oldStatus: string | null = null;
      for (const [status, jobs] of Object.entries(jobsByStatus)) {
        if (jobs.some((j) => j.id === jobId)) {
          oldStatus = status;
          break;
        }
      }

      if (!oldStatus || oldStatus === newStatus) return;

      // Optimistic update
      const job = jobsByStatus[oldStatus].find((j) => j.id === jobId);
      if (!job) return;

      const prevState = { ...jobsByStatus };
      setJobsByStatus((prev) => ({
        ...prev,
        [oldStatus!]: prev[oldStatus!].filter((j) => j.id !== jobId),
        [newStatus]: [job, ...prev[newStatus]],
      }));

      try {
        const res = await fetch(`/api/jobs/${jobId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) throw new Error("Failed to update status");
        toast.success("Status updated");
      } catch {
        setJobsByStatus(prevState);
        toast.error("Failed to move job. Please try again.");
      }
    },
    [jobsByStatus]
  );

  const columns = showClosed
    ? [...ACTIVE_STATUSES, ...CLOSED_STATUSES]
    : ACTIVE_STATUSES;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="mb-4">
        <button
          onClick={() => setShowClosed((v) => !v)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showClosed ? "Hide Closed Jobs" : "Show Closed Jobs"}
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(({ key, label }) => (
          <PipelineColumn
            key={key}
            status={key}
            label={label}
            jobs={jobsByStatus[key] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? <PipelineCard job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
