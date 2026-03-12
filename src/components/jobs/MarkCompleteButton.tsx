"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function MarkCompleteButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "confirming" | "saving">("idle");

  const handleComplete = async () => {
    setState("saving");
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "COMPLETED",
        completedDate: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      toast.success("Job marked as complete");
      router.refresh();
    } else {
      toast.error("Failed to update job");
      setState("idle");
    }
  };

  if (state === "confirming") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Mark complete?</span>
        <Button size="sm" onClick={handleComplete} className="bg-status-success-bg hover:bg-status-success-bg/80 text-status-success-text">
          Yes, complete
        </Button>
        <Button size="sm" variant="outline" onClick={() => setState("idle")}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => setState("confirming")}
      disabled={state === "saving"}
      className="bg-status-success-bg hover:bg-status-success-bg/80 text-status-success-text"
    >
      <CheckCircle className="w-4 h-4 mr-1.5" />
      {state === "saving" ? "Saving..." : "Mark Complete"}
    </Button>
  );
}
