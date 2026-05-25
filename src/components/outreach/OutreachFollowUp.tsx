"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format, isPast, addWeeks } from "date-fns";
import { AlertCircle, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  managerId: string;
  nextFollowUpAt: string | null;
  lastContactedAt: string | null;
  onUpdate: () => void;
}

export default function OutreachFollowUp({
  managerId,
  nextFollowUpAt,
  lastContactedAt,
  onUpdate,
}: Props) {
  const [loading, setLoading] = useState<"log" | "snooze" | null>(null);

  if (!nextFollowUpAt) return null;

  const overdue = isPast(new Date(nextFollowUpAt));
  const formattedDate = format(new Date(nextFollowUpAt), "MMM d, yyyy");

  const logFollowUp = async () => {
    setLoading("log");
    try {
      // Update lastContactedAt and clear follow-up
      const res = await fetch(`/api/outreach/${managerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastContactedAt: new Date().toISOString(),
          nextFollowUpAt: null,
        }),
      });
      if (!res.ok) throw new Error();

      // Log a note
      await fetch(`/api/outreach/${managerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FOLLOW_UP",
          content: "Follow-up completed",
        }),
      });

      toast.success("Follow-up logged");
      onUpdate();
    } catch {
      toast.error("Failed to log follow-up");
    } finally {
      setLoading(null);
    }
  };

  const snooze = async () => {
    setLoading("snooze");
    try {
      const newDate = addWeeks(new Date(nextFollowUpAt), 1);
      const res = await fetch(`/api/outreach/${managerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextFollowUpAt: newDate.toISOString() }),
      });
      if (!res.ok) throw new Error();
      toast.success("Follow-up snoozed 1 week");
      onUpdate();
    } catch {
      toast.error("Failed to snooze");
    } finally {
      setLoading(null);
    }
  };

  if (overdue) {
    return (
      <div className="border-l-4 border-l-red-400 bg-status-danger-bg rounded-r-lg px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-status-danger-text">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            <span className="font-medium">Overdue follow-up</span> — was due{" "}
            {formattedDate}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={snooze}
            disabled={loading !== null}
          >
            <Clock className="w-3.5 h-3.5 mr-1" />
            {loading === "snooze" ? "Snoozing..." : "Snooze 1 Week"}
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={logFollowUp}
            disabled={loading !== null}
          >
            {loading === "log" ? "Logging..." : "Log Follow-up"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-l-4 border-l-yellow-400 bg-status-warning-bg rounded-r-lg px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-status-warning-text">
        <Calendar className="w-4 h-4 shrink-0" />
        <span>
          <span className="font-medium">Follow-up scheduled</span> —{" "}
          {formattedDate}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={snooze}
          disabled={loading !== null}
        >
          <Clock className="w-3.5 h-3.5 mr-1" />
          {loading === "snooze" ? "Snoozing..." : "Snooze 1 Week"}
        </Button>
        <Button
          size="sm"
          className="bg-yellow-600 hover:bg-yellow-700 text-white"
          onClick={logFollowUp}
          disabled={loading !== null}
        >
          {loading === "log" ? "Logging..." : "Log Follow-up"}
        </Button>
      </div>
    </div>
  );
}
