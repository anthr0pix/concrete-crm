"use client";

import { format, parseISO, isSameDay } from "date-fns";
import { Phone, MapPin, ExternalLink, Calendar } from "lucide-react";
import { STATUS_COLORS, JOB_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/types";
import Link from "next/link";
import type { CalendarJob } from "./types";

interface DayViewProps {
  jobs: CalendarJob[];
  currentDate: string;
}

function DayViewJobCard({ job }: { job: CalendarJob }) {
  const colorClass = STATUS_COLORS[job.status] || STATUS_COLORS.LEAD;
  const customerName = `${job.customer.firstName} ${job.customer.lastName}`;
  const fullAddress = [job.address, job.city, job.state, job.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="border rounded-xl bg-card shadow-sm">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium">{job.title}</p>
            <p className="text-sm text-muted-foreground">{customerName}</p>
          </div>
          <span
            className={`${colorClass} text-xs font-medium rounded px-2 py-0.5 whitespace-nowrap`}
          >
            {JOB_STATUS_LABELS[job.status] || job.status}
          </span>
        </div>
        {fullAddress && (
          <p className="text-sm text-muted-foreground mt-1">{fullAddress}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {SERVICE_TYPE_LABELS[job.serviceType] || job.serviceType}
        </p>
      </div>
      <div className="border-t px-4 py-2 flex items-center gap-3">
        {job.customer.phone && (
          <a
            href={`tel:${job.customer.phone}`}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
        )}
        {fullAddress && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            Directions
          </a>
        )}
        <Link
          href={`/jobs/${job.id}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Job
        </Link>
      </div>
    </div>
  );
}

export default function DayView({ jobs, currentDate }: DayViewProps) {
  const base = parseISO(currentDate);
  const dayJobs = jobs.filter(
    (j) => j.scheduledDate && isSameDay(parseISO(j.scheduledDate), base)
  );

  if (dayJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Calendar className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm">
          No jobs scheduled for {format(base, "EEEE, MMMM d")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {dayJobs.map((job) => (
        <DayViewJobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
