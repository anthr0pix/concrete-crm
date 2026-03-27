"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { format, isPast } from "date-fns";
import type { OutreachItem } from "./OutreachBoard";

export default function OutreachCard({ item }: { item: OutreachItem }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: item.id,
      data: { item },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const overdue =
    item.nextFollowUpAt && isPast(new Date(item.nextFollowUpAt));

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-card border border-border rounded-xl p-3 cursor-grab active:cursor-grabbing transition-shadow hover:shadow-sm ${
        isDragging ? "opacity-50 shadow-md" : ""
      }`}
    >
      <Link
        href={`/outreach/${item.id}`}
        className="block"
        onClick={(e) => {
          if (isDragging) e.preventDefault();
        }}
      >
        <p className="font-semibold text-sm text-foreground truncate">
          {item.companyName}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {item.contactName}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {item.propertyCount && (
            <span className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {item.propertyCount} properties
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          {item.nextFollowUpAt ? (
            <span
              className={`text-[11px] ${
                overdue
                  ? "text-status-danger-text font-medium"
                  : "text-muted-foreground"
              }`}
            >
              {overdue ? "Overdue: " : "Follow-up: "}
              {format(new Date(item.nextFollowUpAt), "MMM d")}
            </span>
          ) : (
            <span />
          )}
          {item.estimatedValue != null && item.estimatedValue > 0 && (
            <span className="text-sm font-bold text-foreground">
              ${item.estimatedValue.toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
              /yr
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
