"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export default function DuplicateInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const duplicate = async () => {
    setLoading(true);
    const res = await fetch(`/api/invoices/${invoiceId}/duplicate`, { method: "POST" });
    setLoading(false);
    if (!res.ok) { toast.error("Failed to duplicate invoice"); return; }
    const invoice = await res.json();
    toast.success(`Invoice ${invoice.invoiceNumber} created`);
    router.push(`/invoices/${invoice.id}`);
  };

  return (
    <Button size="sm" variant="outline" onClick={duplicate} disabled={loading}>
      <Copy className="w-3.5 h-3.5 mr-1" />
      {loading ? "Duplicating..." : "Duplicate"}
    </Button>
  );
}
