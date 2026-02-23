"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { JOB_STATUS_LABELS } from "@/types";
import { JobStatus } from "@prisma/client";

const STATUS_COLORS: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-700",
  QUOTED: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
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
  );
}
