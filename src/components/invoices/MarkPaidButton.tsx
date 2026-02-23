"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function MarkPaidButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const markPaid = async () => {
    setLoading(true);
    const res = await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID", paidDate: new Date().toISOString() }),
    });
    setLoading(false);
    if (res.ok) { toast.success("Invoice marked as paid"); router.refresh(); }
    else toast.error("Failed to update");
  };

  return (
    <Button size="sm" onClick={markPaid} disabled={loading} className="bg-green-600 hover:bg-green-700">
      <CheckCircle className="w-3.5 h-3.5 mr-1" />
      {loading ? "Updating..." : "Mark Paid"}
    </Button>
  );
}
