"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Receipt } from "lucide-react";

export default function ConvertToInvoiceButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const convert = async () => {
    setLoading(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromQuoteId: quoteId }),
    });
    setLoading(false);
    if (!res.ok) { toast.error("Failed to create invoice"); return; }
    const invoice = await res.json();
    toast.success(`Invoice ${invoice.invoiceNumber} created`);
    router.push(`/invoices/${invoice.id}`);
  };

  return (
    <Button size="sm" onClick={convert} disabled={loading}>
      <Receipt className="w-3.5 h-3.5 mr-1" />
      {loading ? "Creating..." : "Convert to Invoice"}
    </Button>
  );
}
