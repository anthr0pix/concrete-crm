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
import OutreachColumn from "./OutreachColumn";
import OutreachCard from "./OutreachCard";

export interface OutreachItem {
  id: string;
  companyName: string;
  contactName: string;
  propertyCount: number | null;
  estimatedValue: number | null;
  nextFollowUpAt: string | null;
}

const ACTIVE_STATUSES = [
  { key: "PROSPECT", label: "Prospect" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "IN_CONVERSATION", label: "In Conversation" },
  { key: "PROPOSAL_SENT", label: "Proposal Sent" },
];

const CLOSED_STATUSES = [
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
];

export default function OutreachBoard({
  initialItems,
}: {
  initialItems: Record<string, OutreachItem[]>;
}) {
  const [itemsByStatus, setItemsByStatus] =
    useState<Record<string, OutreachItem[]>>(initialItems);
  const [activeItem, setActiveItem] = useState<OutreachItem | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = event.active.data.current?.item as OutreachItem | undefined;
    if (item) setActiveItem(item);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveItem(null);

      const { active, over } = event;
      if (!over) return;

      const itemId = active.id as string;
      const newStatus = over.id as string;

      // Find current status
      let oldStatus: string | null = null;
      for (const [status, items] of Object.entries(itemsByStatus)) {
        if (items.some((i) => i.id === itemId)) {
          oldStatus = status;
          break;
        }
      }

      if (!oldStatus || oldStatus === newStatus) return;

      const item = itemsByStatus[oldStatus].find((i) => i.id === itemId);
      if (!item) return;

      // Optimistic update
      const prevState = { ...itemsByStatus };
      setItemsByStatus((prev) => ({
        ...prev,
        [oldStatus!]: prev[oldStatus!].filter((i) => i.id !== itemId),
        [newStatus]: [item, ...prev[newStatus]],
      }));

      try {
        const res = await fetch(`/api/outreach/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) throw new Error("Failed to update status");
        toast.success("Status updated");
      } catch {
        setItemsByStatus(prevState);
        toast.error("Failed to move prospect. Please try again.");
      }
    },
    [itemsByStatus]
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
          {showClosed ? "Hide Won/Lost" : "Show Won/Lost"}
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(({ key, label }) => (
          <OutreachColumn
            key={key}
            status={key}
            label={label}
            items={itemsByStatus[key] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem ? <OutreachCard item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
