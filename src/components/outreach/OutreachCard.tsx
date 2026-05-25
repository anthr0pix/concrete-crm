"use client";

import Link from "next/link";
import { useDraggable } from "@dnd-kit/core";
import { format, isPast } from "date-fns";
import { Phone, Mail, Building2, Globe, MapPin, MessageSquare, Clock, Briefcase } from "lucide-react";
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
  const location = [item.city, item.state].filter(Boolean).join(", ");

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

        {location && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" />
            {location}
          </div>
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
          <div className="flex items-center gap-1.5">
            {item.propertyCount ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                <Building2 className="w-3 h-3" />
                {item.propertyCount}
              </span>
            ) : null}
            {item.jobCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                <Briefcase className="w-3 h-3" />
                {item.jobCount}
              </span>
            )}
            {item.noteCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                <MessageSquare className="w-3 h-3" />
                {item.noteCount}
              </span>
            )}
          </div>
          <div className="text-right">
            {item.nextFollowUpAt && (
              <span
                className={`text-[11px] block ${
                  overdue
                    ? "text-status-danger-text font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {overdue ? "Overdue: " : "Follow-up: "}
                {format(new Date(item.nextFollowUpAt), "MMM d")}
              </span>
            )}
            {item.lastContactedAt && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1 justify-end">
                <Clock className="w-3 h-3" />
                {format(new Date(item.lastContactedAt), "MMM d")}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
