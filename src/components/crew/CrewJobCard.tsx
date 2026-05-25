"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Navigation, Play, CheckCircle, MessageSquare, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { STATUS_COLORS, JOB_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/types";
import CrewPhotoUpload from "./CrewPhotoUpload";
import CrewNoteInput from "./CrewNoteInput";

interface CrewJob {
  id: string;
  title: string;
  serviceType: string;
  status: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  crewAssignment: string | null;
  scheduledDate: string | null;
  customerId: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  _count: { photos: number };
}

interface Props {
  job: CrewJob;
}

export default function CrewJobCard({ job }: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [expanded, setExpanded] = useState<"note" | "photo" | null>(null);

  const jobAddress = job.address
    ? `${job.address}, ${job.city}, ${job.state} ${job.zip}`
    : `${job.customer.address}, ${job.customer.city}, ${job.customer.state} ${job.customer.zip}`;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(jobAddress)}`;

  const toggleStatus = async () => {
    const newStatus = job.status === "SCHEDULED" ? "IN_PROGRESS" : "COMPLETED";
    setUpdating(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === "COMPLETED" ? { completedDate: new Date().toISOString() } : {}),
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(newStatus === "IN_PROGRESS" ? "Job started" : "Job completed");
      router.refresh();
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const isScheduled = job.status === "SCHEDULED";
  const isInProgress = job.status === "IN_PROGRESS";

  return (
    <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{job.title}</h3>
            <p className="text-xs text-muted-foreground">
              {SERVICE_TYPE_LABELS[job.serviceType] ?? job.serviceType}
              {job.crewAssignment && ` · ${job.crewAssignment}`}
            </p>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[job.status]}`}>
            {JOB_STATUS_LABELS[job.status]}
          </span>
        </div>

        {/* Customer + Address */}
        <p className="text-sm font-medium mb-1">
          {job.customer.firstName} {job.customer.lastName}
        </p>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground flex items-start gap-1"
        >
          <Navigation className="w-3 h-3 mt-0.5 shrink-0" />
          {jobAddress}
        </a>
      </div>

      {/* Action Bar */}
      <div className="border-t px-3 py-2 flex flex-wrap items-center gap-1.5">
        {/* Call */}
        <a href={`tel:${job.customer.phone}`}>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Phone className="w-4 h-4" />
          </Button>
        </a>

        {/* Email */}
        {job.customer.email && (
          <a href={`mailto:${job.customer.email}`}>
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Mail className="w-4 h-4" />
            </Button>
          </a>
        )}

        {/* Navigate */}
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Navigation className="w-4 h-4" />
          </Button>
        </a>

        {/* Status Toggle */}
        {(isScheduled || isInProgress) && (
          <Button
            size="sm"
            className="h-8 ml-auto"
            variant={isScheduled ? "default" : "default"}
            disabled={updating}
            onClick={toggleStatus}
          >
            {isScheduled ? (
              <>
                <Play className="w-3.5 h-3.5 mr-1" />
                Start
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                Complete
              </>
            )}
          </Button>
        )}

        {/* Expand buttons */}
        <Button
          variant={expanded === "photo" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
          onClick={() => setExpanded(expanded === "photo" ? null : "photo")}
        >
          {expanded === "photo" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
        <Button
          variant={expanded === "note" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 px-2"
          onClick={() => setExpanded(expanded === "note" ? null : "note")}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>

        {/* View full */}
        <a href={`/jobs/${job.id}`}>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Eye className="w-4 h-4" />
          </Button>
        </a>
      </div>

      {/* Expandable sections */}
      {expanded === "photo" && (
        <div className="border-t px-4 py-3">
          <CrewPhotoUpload
            jobId={job.id}
            photoCount={job._count.photos}
            onDone={() => {
              setExpanded(null);
              router.refresh();
            }}
          />
        </div>
      )}
      {expanded === "note" && (
        <div className="border-t px-4 py-3">
          <CrewNoteInput
            customerId={job.customerId}
            jobId={job.id}
            onDone={() => setExpanded(null)}
          />
        </div>
      )}
    </div>
  );
}
