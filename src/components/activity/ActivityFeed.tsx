"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Mail,
  ArrowRight,
  MessageSquare,
  DollarSign,
  Camera,
  Plus,
  CheckCircle,
  XCircle,
  FileText,
  Receipt,
  Clock,
  Star,
  Bell,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Activity } from "@/types";
import { ACTIVITY_TYPE_LABELS } from "@/types";

const ACTIVITY_ICONS: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  EMAIL_SENT: { icon: Mail, color: "text-blue-500" },
  STATUS_CHANGED: { icon: ArrowRight, color: "text-orange-500" },
  NOTE_ADDED: { icon: MessageSquare, color: "text-gray-500" },
  PAYMENT_RECEIVED: { icon: DollarSign, color: "text-green-500" },
  PHOTO_UPLOADED: { icon: Camera, color: "text-purple-500" },
  JOB_CREATED: { icon: Plus, color: "text-blue-500" },
  QUOTE_CREATED: { icon: FileText, color: "text-blue-500" },
  INVOICE_CREATED: { icon: Receipt, color: "text-blue-500" },
  QUOTE_APPROVED: { icon: CheckCircle, color: "text-green-500" },
  QUOTE_DECLINED: { icon: XCircle, color: "text-red-500" },
  QUOTE_CHANGES_REQUESTED: { icon: Clock, color: "text-yellow-500" },
  FOLLOW_UP_SENT: { icon: Send, color: "text-blue-400" },
  REVIEW_REQUEST_SENT: { icon: Star, color: "text-yellow-500" },
  RESEAL_REMINDER_SENT: { icon: Bell, color: "text-orange-500" },
  DEPOSIT_RECEIVED: { icon: DollarSign, color: "text-green-500" },
};

interface Props {
  customerId: string;
  jobId?: string;
}

export default function ActivityFeed({ customerId, jobId }: Props) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchActivities = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams({ customerId });
      if (jobId) params.set("jobId", jobId);
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/activities?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (cursor) {
        setActivities((prev) => [...prev, ...data.activities]);
      } else {
        setActivities(data.activities);
      }
      setNextCursor(data.nextCursor);
    } catch {
      toast.error("Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [customerId, jobId]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const addNote = async () => {
    if (!noteText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/activities/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, jobId, content: noteText.trim() }),
      });
      if (!res.ok) throw new Error();
      setNoteText("");
      toast.success("Note added");
      fetchActivities();
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm p-4 sm:p-6">
      <h2 className="font-semibold text-base mb-4 border-b pb-2">Activity</h2>

      {/* Add Note Form */}
      <div className="mb-6">
        <Textarea
          placeholder="Add a note..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={2}
          className="mb-2 resize-none"
        />
        <Button
          size="sm"
          onClick={addNote}
          disabled={!noteText.trim() || submitting}
        >
          {submitting ? "Adding..." : "Add Note"}
        </Button>
      </div>

      {/* Timeline */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading activity...</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet</p>
      ) : (
        <div className="space-y-0">
          {activities.map((activity, i) => {
            const config = ACTIVITY_ICONS[activity.type] ?? { icon: Clock, color: "text-gray-400" };
            const Icon = config.icon;
            const isLast = i === activities.length - 1;

            return (
              <div key={activity.id} className="flex gap-3">
                {/* Timeline line + icon */}
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-border min-h-4" />}
                </div>

                {/* Content */}
                <div className={`pb-4 ${isLast ? "" : ""}`}>
                  <p className="text-sm">
                    {activity.type === "NOTE_ADDED" ? (
                      activity.description
                    ) : (
                      <>
                        <span className="font-medium">{ACTIVITY_TYPE_LABELS[activity.type]}</span>
                        {" — "}
                        {activity.description}
                      </>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
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
          onClick={() => fetchActivities(nextCursor)}
        >
          Load more
        </Button>
      )}
    </div>
  );
}
