"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export default function DuplicateQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const duplicate = async () => {
    setLoading(true);
    const res = await fetch(`/api/quotes/${quoteId}/duplicate`, { method: "POST" });
    setLoading(false);
    if (!res.ok) { toast.error("Failed to duplicate quote"); return; }
    const quote = await res.json();
    toast.success(`Quote ${quote.quoteNumber} created`);
    router.push(`/quotes/${quote.id}`);
  };

  return (
    <Button size="sm" variant="outline" onClick={duplicate} disabled={loading}>
      <Copy className="w-3.5 h-3.5 mr-1" />
      {loading ? "Duplicating..." : "Duplicate"}
    </Button>
  );
}
