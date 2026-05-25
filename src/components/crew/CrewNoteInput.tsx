"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Props {
  customerId: string;
  jobId: string;
  onDone?: () => void;
}

export default function CrewNoteInput({ customerId, jobId, onDone }: Props) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/activities/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, jobId, content: text.trim() }),
      });
      if (!res.ok) throw new Error();
      setText("");
      toast.success("Note added");
      onDone?.();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Add a field note..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="resize-none text-sm"
      />
      <Button size="sm" onClick={submit} disabled={!text.trim() || submitting}>
        {submitting ? "Saving..." : "Save Note"}
      </Button>
    </div>
  );
}
