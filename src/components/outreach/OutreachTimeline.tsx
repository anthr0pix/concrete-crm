"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  MessageSquare,
  Phone,
  Mail,
  ArrowRight,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OutreachNote } from "@/types";

const NOTE_ICONS: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  NOTE: { icon: MessageSquare, color: "text-gray-500" },
  CALL: { icon: Phone, color: "text-blue-500" },
  EMAIL: { icon: Mail, color: "text-purple-500" },
  STATUS_CHANGE: { icon: ArrowRight, color: "text-orange-500" },
  FOLLOW_UP: { icon: Calendar, color: "text-green-500" },
};

const TYPE_LABELS: Record<string, string> = {
  NOTE: "Note",
  CALL: "Call",
  EMAIL: "Email",
  STATUS_CHANGE: "Status Change",
  FOLLOW_UP: "Follow-up",
};

interface Props {
  managerId: string;
}

export default function OutreachTimeline({ managerId }: Props) {
  const [notes, setNotes] = useState<OutreachNote[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [type, setType] = useState<string>("NOTE");
  const [submitting, setSubmitting] = useState(false);

  const fetchNotes = useCallback(
    async (cursor?: string) => {
      try {
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);

        const res = await fetch(
          `/api/outreach/${managerId}/notes?${params}`,
        );
        if (!res.ok) throw new Error();
        const data = await res.json();

        if (cursor) {
          setNotes((prev) => [...prev, ...data.notes]);
        } else {
          setNotes(data.notes);
        }
        setNextCursor(data.nextCursor);
      } catch {
        toast.error("Failed to load notes");
      } finally {
        setLoading(false);
      }
    },
    [managerId],
  );

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/outreach/${managerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content: content.trim() }),
      });
      if (!res.ok) throw new Error();
      setContent("");
      setType("NOTE");
      toast.success(
        type === "CALL"
          ? "Call logged"
          : type === "EMAIL"
            ? "Email logged"
            : "Note added",
      );
      fetchNotes();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm p-4 sm:p-6">
      <h2 className="font-semibold text-base mb-4 border-b pb-2">
        Interaction Timeline
      </h2>

      {/* Add Note Form */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NOTE">Note</SelectItem>
              <SelectItem value="CALL">Call</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Textarea
          placeholder={
            type === "CALL"
              ? "Log call details..."
              : type === "EMAIL"
                ? "Log email details..."
                : "Add a note..."
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          className="mb-2 resize-none"
        />
        <Button
          size="sm"
          onClick={addNote}
          disabled={!content.trim() || submitting}
        >
          {submitting
            ? "Adding..."
            : type === "CALL"
              ? "Log Call"
              : type === "EMAIL"
                ? "Log Email"
                : "Add Note"}
        </Button>
      </div>

      {/* Timeline */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading timeline...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No interactions logged yet
        </p>
      ) : (
        <div className="space-y-0">
          {notes.map((note, i) => {
            const config = NOTE_ICONS[note.type] ?? {
              icon: Clock,
              color: "text-gray-400",
            };
            const Icon = config.icon;
            const isLast = i === notes.length - 1;

            return (
              <div key={note.id} className="flex gap-3">
                {/* Timeline line + icon */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-border min-h-4" />}
                </div>

                {/* Content */}
                <div className="pb-4">
                  <p className="text-sm">
                    {note.type === "STATUS_CHANGE" ? (
                      <>
                        <span className="font-medium">
                          {TYPE_LABELS[note.type]}
                        </span>
                        {" — "}
                        {note.content}
                      </>
                    ) : (
                      <>
                        {note.type !== "NOTE" && (
                          <>
                            <span className="font-medium">
                              {TYPE_LABELS[note.type]}
                            </span>
                            {" — "}
                          </>
                        )}
                        {note.content}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(note.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {nextCursor && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2"
          onClick={() => fetchNotes(nextCursor)}
        >
          Load more
        </Button>
      )}
    </div>
  );
}
