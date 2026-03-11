"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { JOB_STATUS_LABELS, STATUS_COLORS } from "@/types";
import { JobStatus } from "@prisma/client";

const STATUS_DESCRIPTIONS: Record<string, string> = {
  LEAD: "New inquiry — not yet quoted",
  QUOTED: "Quote sent, waiting for customer response",
  SCHEDULED: "Customer approved, date is set",
  IN_PROGRESS: "Crew is on-site working",
  COMPLETED: "Work finished, ready to invoice",
  CANCELLED: "Job was cancelled",
};

interface Props {
  jobId: string;
  currentStatus: JobStatus;
}

export default function JobStatusSelect({ jobId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const onChange = async (newStatus: JobStatus) => {
    setSaving(true);
    setStatus(newStatus);
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success("Status updated");
      router.refresh();
    } else {
      toast.error("Failed to update status");
      setStatus(currentStatus);
    }
  };

  return (
    <div>
      <select
        value={status}
        disabled={saving}
        onChange={(e) => onChange(e.target.value as JobStatus)}
        className={`text-sm font-medium px-3 py-1.5 rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer ${STATUS_COLORS[status]}`}
      >
        {Object.entries(JOB_STATUS_LABELS).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
      <p className="text-xs text-slate-400 mt-1">{STATUS_DESCRIPTIONS[status]}</p>
    </div>
  );
}
