"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { QUOTE_STATUS_LABELS, STATUS_COLORS } from "@/types";
import { QuoteStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
      <Select value={status} onValueChange={(v) => onChange(v as QuoteStatus)}>
        <SelectTrigger className={cn("w-fit gap-2 border-0 font-medium text-sm", STATUS_COLORS[status])}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(QUOTE_STATUS_LABELS).map(([val, label]) => (
            <SelectItem key={val} value={val}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">{STATUS_DESCRIPTIONS[status]}</p>
    </div>
  );
}
