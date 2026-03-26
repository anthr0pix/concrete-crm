"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SettingsDefaults {
  reviewDelayDays: number;
  reviewRequestEnabled: boolean;
  googleReviewUrl: string;
  resealReminderMonths: number;
  resealReminderEnabled: boolean;
}

export default function SettingsForm({ defaults }: { defaults: SettingsDefaults }) {
  const [reviewDelayDays, setReviewDelayDays] = useState(defaults.reviewDelayDays);
  const [reviewRequestEnabled, setReviewRequestEnabled] = useState(defaults.reviewRequestEnabled);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(defaults.googleReviewUrl);
  const [resealReminderMonths, setResealReminderMonths] = useState(defaults.resealReminderMonths);
  const [resealReminderEnabled, setResealReminderEnabled] = useState(defaults.resealReminderEnabled);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewDelayDays,
          reviewRequestEnabled,
          googleReviewUrl: googleReviewUrl.trim() || null,
          resealReminderMonths,
          resealReminderEnabled,
        }),
      });

      if (res.ok) {
        toast.success("Settings saved");
      } else {
        const data = await res.json();
        toast.error(data.error?.formErrors?.[0] || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Review Requests Section */}
      <div className="bg-card border rounded-xl p-4 sm:p-6">
        <h2 className="font-semibold text-lg mb-4">Review Requests</h2>
        <div className="space-y-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={reviewRequestEnabled}
              onChange={(e) => setReviewRequestEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm font-medium">Enable automatic review requests</span>
          </label>
          <p className="text-xs text-muted-foreground -mt-3 ml-7">
            Automatically send review request emails to customers after job completion.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="reviewDelayDays">Days after job completion</Label>
            <Input
              id="reviewDelayDays"
              type="number"
              min={1}
              max={30}
              value={reviewDelayDays}
              onChange={(e) => setReviewDelayDays(Number(e.target.value))}
              className="max-w-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              How many days to wait after a job is marked complete before sending a review request (1-30).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="googleReviewUrl">Google Review URL</Label>
            <Input
              id="googleReviewUrl"
              type="url"
              placeholder="https://g.page/r/..."
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              The direct link to your Google Business review page. Customers will be directed here to leave a review.
            </p>
          </div>
        </div>
      </div>

      {/* Reseal Reminders Section */}
      <div className="bg-card border rounded-xl p-4 sm:p-6">
        <h2 className="font-semibold text-lg mb-4">Reseal Reminders</h2>
        <div className="space-y-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={resealReminderEnabled}
              onChange={(e) => setResealReminderEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
            />
            <span className="text-sm font-medium">Enable reseal reminders</span>
          </label>
          <p className="text-xs text-muted-foreground -mt-3 ml-7">
            Automatically send reminder emails when a customer&apos;s surface is due for resealing.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="resealReminderMonths">Months between resealing</Label>
            <Input
              id="resealReminderMonths"
              type="number"
              min={1}
              max={60}
              value={resealReminderMonths}
              onChange={(e) => setResealReminderMonths(Number(e.target.value))}
              className="max-w-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              How many months after job completion to send a reseal reminder to the customer (1-60). Most concrete sealers recommend resealing every 24 months.
            </p>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
