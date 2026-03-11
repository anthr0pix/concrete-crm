"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { QUOTE_STATUS_LABELS, STATUS_COLORS } from "@/types";
import { QuoteStatus } from "@prisma/client";

const STATUS_DESCRIPTIONS: Record<string, string> = {
  DRAFT: "Still editing — not sent yet",
  SENT: "Emailed to customer, waiting for response",
  ACCEPTED: "Customer approved this quote",
  DECLINED: "Customer passed on this quote",
  EXPIRED: "Quote validity period has ended",
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
    <div>
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as QuoteStatus)}
        className={`text-sm font-medium px-3 py-1.5 rounded-md border-0 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer ${STATUS_COLORS[status]}`}
      >
        {Object.entries(QUOTE_STATUS_LABELS).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
      <p className="text-xs text-slate-400 mt-1">{STATUS_DESCRIPTIONS[status]}</p>
    </div>
  );
}
