"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";

const settingsSchema = z.object({
  reviewDelayDays: z.coerce.number().min(1, "Must be at least 1").max(30, "Must be 30 or less"),
  reviewRequestEnabled: z.boolean(),
  googleReviewUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  resealReminderMonths: z.coerce.number().min(1, "Must be at least 1").max(60, "Must be 60 or less"),
  resealReminderEnabled: z.boolean(),
});

type SettingsData = z.infer<typeof settingsSchema>;

interface SettingsDefaults {
  reviewDelayDays: number;
  reviewRequestEnabled: boolean;
  googleReviewUrl: string;
  resealReminderMonths: number;
  resealReminderEnabled: boolean;
}

export default function SettingsForm({ defaults }: { defaults: SettingsDefaults }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaults,
  });

  useUnsavedChanges(isDirty);

  const onSubmit = async (data: SettingsData) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          googleReviewUrl: data.googleReviewUrl.trim() || null,
        }),
      });

      if (res.ok) {
        toast.success("Settings saved");
      } else {
        const result = await res.json();
        toast.error(result.error?.formErrors?.[0] || "Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Review Requests Section */}
      <div className="bg-card border rounded-xl p-4 sm:p-6">
        <h2 className="font-semibold text-base mb-4">Review Requests</h2>
        <div className="space-y-5">
          <Controller
            name="reviewRequestEnabled"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="reviewRequestEnabled"
                />
                <Label htmlFor="reviewRequestEnabled" className="cursor-pointer text-sm font-medium">
                  Enable automatic review requests
                </Label>
              </div>
            )}
          />
          <p className="text-xs text-muted-foreground -mt-3 ml-12">
            Automatically send review request emails to customers after job completion.
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="reviewDelayDays">Days after job completion</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Automated email asking for a Google review this many days after marking a job complete
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              {...register("reviewDelayDays")}
              id="reviewDelayDays"
              type="number"
              min={1}
              max={30}
              className="max-w-[120px]"
            />
            {errors.reviewDelayDays && (
              <p className="text-xs text-destructive">{errors.reviewDelayDays.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="googleReviewUrl">Google Review URL</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Find this in your Google Business Profile under &quot;Get more reviews&quot;
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              {...register("googleReviewUrl")}
              id="googleReviewUrl"
              type="url"
              placeholder="https://g.page/r/..."
            />
            {errors.googleReviewUrl && (
              <p className="text-xs text-destructive">{errors.googleReviewUrl.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Reseal Reminders Section */}
      <div className="bg-card border rounded-xl p-4 sm:p-6">
        <h2 className="font-semibold text-base mb-4">Reseal Reminders</h2>
        <div className="space-y-5">
          <Controller
            name="resealReminderEnabled"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id="resealReminderEnabled"
                />
                <Label htmlFor="resealReminderEnabled" className="cursor-pointer text-sm font-medium">
                  Enable reseal reminders
                </Label>
              </div>
            )}
          />
          <p className="text-xs text-muted-foreground -mt-3 ml-12">
            Automatically send reminder emails when a customer&apos;s surface is due for resealing.
          </p>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label htmlFor="resealReminderMonths">Months between resealing</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Customers receive a maintenance reminder when their surface is due
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              {...register("resealReminderMonths")}
              id="resealReminderMonths"
              type="number"
              min={1}
              max={60}
              className="max-w-[120px]"
            />
            {errors.resealReminderMonths && (
              <p className="text-xs text-destructive">{errors.resealReminderMonths.message}</p>
            )}
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Settings"}
      </Button>
    </form>
  );
}
