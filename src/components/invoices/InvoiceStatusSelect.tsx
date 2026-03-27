"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { INVOICE_STATUS_LABELS, STATUS_COLORS } from "@/types";
import { InvoiceStatus } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_DESCRIPTIONS: Record<string, string> = {
  DRAFT: "Still editing — not sent yet",
  SENT: "Emailed to customer, awaiting payment",
  PAID: "Payment received in full",
  OVERDUE: "Past due date, not yet paid",
  VOID: "Cancelled — no longer valid",
};

export default function InvoiceStatusSelect({ invoiceId, currentStatus }: { invoiceId: string; currentStatus: InvoiceStatus }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);

  const onChange = async (newStatus: InvoiceStatus) => {
    setStatus(newStatus);
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { toast.success("Status updated"); router.refresh(); }
    else { toast.error("Update failed"); setStatus(currentStatus); }
  };

  return (
    <div>
      <Select value={status} onValueChange={(v) => onChange(v as InvoiceStatus)}>
        <SelectTrigger className={cn("w-fit gap-2 border-0 font-medium text-sm", STATUS_COLORS[status])}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(INVOICE_STATUS_LABELS).map(([val, label]) => (
            <SelectItem key={val} value={val}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground mt-1">{STATUS_DESCRIPTIONS[status]}</p>
    </div>
  );
}
