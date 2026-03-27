"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";

export function ExpireQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleExpire = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "EXPIRED" }),
      });
      if (!res.ok) throw new Error();
      toast.success("Quote marked as expired");
      router.refresh();
    } catch {
      toast.error("Failed to expire quote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExpire}
      disabled={loading}
      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
      title="Mark as expired"
    >
      <X className="w-3.5 h-3.5" />
    </button>
  );
}

export function ExpireAllStaleButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const handleExpireAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quotes/expire-stale", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Expired ${data.expired} stale quote${data.expired !== 1 ? "s" : ""}`);
      router.refresh();
    } catch {
      toast.error("Failed to expire quotes");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <span className="ml-auto flex items-center gap-1.5">
        <button
          onClick={handleExpireAll}
          disabled={loading}
          className="text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
        >
          {loading ? "Expiring..." : "Yes, expire all"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto"
    >
      Expire all quotes
    </button>
  );
}
