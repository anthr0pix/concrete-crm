"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { format, isPast } from "date-fns";
import { Phone, Mail, Building2, Globe } from "lucide-react";
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

  const overdue = item.nextFollowUpAt && isPast(new Date(item.nextFollowUpAt));

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

        {item.contactName && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.contactName}
          </p>
        )}

        <div className="mt-2 space-y-1">
          {item.phone && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
              <Phone className="w-3 h-3 shrink-0" />
              {item.phone}
            </div>
          )}
          {item.email && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
              <Mail className="w-3 h-3 shrink-0" />
              {item.email}
            </div>
          )}
          {item.website && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
              <Globe className="w-3 h-3 shrink-0" />
              {item.website.replace(/^https?:\/\/(www\.)?/, "")}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          {item.propertyCount ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              <Building2 className="w-3 h-3" />
              {item.propertyCount}
            </span>
          ) : (
            <span />
          )}
          {item.nextFollowUpAt && (
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
          )}
        </div>
      </Link>
    </div>
  );
}
