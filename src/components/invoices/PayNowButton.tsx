"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  invoiceId: string;
}

export default function PayNowButton({ invoiceId }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle");

  const handleClick = async () => {
    setState("loading");
    try {
      const res = await fetch("/api/square/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to generate payment link");
        setState("idle");
        return;
      }
      const { url } = await res.json();
      await navigator.clipboard.writeText(url);
      toast.success("Payment link copied to clipboard!");
      setState("copied");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      toast.error("Something went wrong");
      setState("idle");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={state === "loading"}
    >
      {state === "loading" ? (
        <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Generating...</>
      ) : state === "copied" ? (
        <><Check className="w-3.5 h-3.5 mr-1" /> Copied!</>
      ) : (
        <><CreditCard className="w-3.5 h-3.5 mr-1" /> Copy Payment Link</>
      )}
    </Button>
  );
}
