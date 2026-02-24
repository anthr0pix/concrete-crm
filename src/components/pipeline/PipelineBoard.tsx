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

interface PipelineJob {
  id: string;
  title: string;
  serviceType: string;
  customer: { firstName: string; lastName: string };
  total?: number;
  createdAt: string;
}

const PIPELINE_STAGES = [
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "QUOTE_SENT", label: "Quote Sent" },
  { key: "FOLLOW_UP", label: "Follow Up" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
];

export default function PipelineBoard({
  initialJobs,
}: {
  initialJobs: Record<string, PipelineJob[]>;
}) {
  const [jobsByStage, setJobsByStage] =
    useState<Record<string, PipelineJob[]>>(initialJobs);
  const [activeJob, setActiveJob] = useState<PipelineJob | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const job = event.active.data.current?.job as PipelineJob | undefined;
    if (job) {
      setActiveJob(job);
    }
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveJob(null);

      const { active, over } = event;
      if (!over) return;

      const jobId = active.id as string;
      const newStage = over.id as string;

      // Find current stage for this job
      let oldStage: string | null = null;
      for (const [stage, jobs] of Object.entries(jobsByStage)) {
        if (jobs.some((j) => j.id === jobId)) {
          oldStage = stage;
          break;
        }
      }

      if (!oldStage || oldStage === newStage) return;

      // Optimistic update
      const job = jobsByStage[oldStage].find((j) => j.id === jobId);
      if (!job) return;

      const prevState = { ...jobsByStage };
      setJobsByStage((prev) => ({
        ...prev,
        [oldStage!]: prev[oldStage!].filter((j) => j.id !== jobId),
        [newStage]: [job, ...prev[newStage]],
      }));

      try {
        const res = await fetch(`/api/jobs/${jobId}/pipeline`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pipelineStage: newStage }),
        });

        if (!res.ok) {
          throw new Error("Failed to update pipeline stage");
        }

        toast.success("Pipeline stage updated");
      } catch {
        // Revert on error
        setJobsByStage(prevState);
        toast.error("Failed to move lead. Please try again.");
      }
    },
    [jobsByStage]
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(({ key, label }) => (
          <PipelineColumn
            key={key}
            stage={key}
            label={label}
            jobs={jobsByStage[key] || []}
            color={key}
          />
        ))}
      </div>

      <DragOverlay>
        {activeJob ? <PipelineCard job={activeJob} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
