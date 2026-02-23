"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { QUOTE_STATUS_LABELS } from "@/types";
import { QuoteStatus } from "@prisma/client";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
};

export default function QuoteStatusSelect({ quoteId, currentStatus }: { quoteId: string; currentStatus: QuoteStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);

  const onChange = async (newStatus: QuoteStatus) => {
    setStatus(newStatus);
    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { toast.success("Status updated"); router.refresh(); }
    else { toast.error("Update failed"); setStatus(currentStatus); }
  };

  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as QuoteStatus)}
      className={`text-sm font-medium px-3 py-1.5 rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer ${STATUS_COLORS[status]}`}
    >
      {Object.entries(QUOTE_STATUS_LABELS).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
}
