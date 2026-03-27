"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirming" | "deleting">("idle");

  const handleDelete = async () => {
    setState("deleting");
    const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      router.push("/quotes");
    } else {
      toast.error("Failed to delete");
      setState("idle");
    }
  };

  if (state === "confirming") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Delete this quote?</span>
        <Button size="sm" variant="destructive" onClick={handleDelete}>Yes, delete</Button>
        <Button size="sm" variant="outline" onClick={() => setState("idle")}>Cancel</Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
      onClick={() => setState("confirming")}
      disabled={state === "deleting"}
    >
      <Trash2 className="w-3.5 h-3.5 mr-1" />
      {state === "deleting" ? "Deleting..." : "Delete"}
    </Button>
  );
}
