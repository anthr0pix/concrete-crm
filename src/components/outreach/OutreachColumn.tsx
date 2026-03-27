"use client";

import { useDroppable } from "@dnd-kit/core";
import OutreachCard from "./OutreachCard";
import type { OutreachItem } from "./OutreachBoard";

const COLUMN_COLORS: Record<
  string,
  { border: string; bg: string; badge: string; dropBg: string }
> = {
  PROSPECT: {
    border: "border-t-slate-400",
    bg: "bg-status-neutral-bg",
    badge: "bg-status-neutral-bg text-status-neutral-text",
    dropBg: "bg-muted",
  },
  CONTACTED: {
    border: "border-t-blue-400",
    bg: "bg-status-info-bg",
    badge: "bg-status-info-bg text-status-info-text",
    dropBg: "bg-muted",
  },
  IN_CONVERSATION: {
    border: "border-t-yellow-400",
    bg: "bg-status-warning-bg",
    badge: "bg-status-warning-bg text-status-warning-text",
    dropBg: "bg-muted",
  },
  PROPOSAL_SENT: {
    border: "border-t-purple-400",
    bg: "bg-status-purple-bg",
    badge: "bg-status-purple-bg text-status-purple-text",
    dropBg: "bg-muted",
  },
  WON: {
    border: "border-t-green-400",
    bg: "bg-status-success-bg",
    badge: "bg-status-success-bg text-status-success-text",
    dropBg: "bg-muted",
  },
  LOST: {
    border: "border-t-red-400",
    bg: "bg-status-danger-bg",
    badge: "bg-status-danger-bg text-status-danger-text",
    dropBg: "bg-muted",
  },
};

export default function OutreachColumn({
  status,
  label,
  items,
}: {
  status: string;
  label: string;
  items: OutreachItem[];
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  const colors = COLUMN_COLORS[status] || COLUMN_COLORS.PROSPECT;
  const totalValue = items.reduce(
    (sum, i) => sum + (i.estimatedValue ?? 0),
    0
  );

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
          {totalValue > 0 && (
            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
              ${totalValue.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              /yr
            </span>
          )}
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}
          >
            {items.length}
          </span>
        </div>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-220px)]">
        {items.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">
            Drag prospects here
          </div>
        ) : (
          items.map((item) => <OutreachCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  );
}
