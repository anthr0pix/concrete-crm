"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/required-label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { formatPhoneInput } from "@/lib/utils";
import { OUTREACH_STATUS_LABELS } from "@/types";

const schema = z.object({
  companyName: z.string().min(1, "Required"),
  contactName: z.string().min(1, "Required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional(),
  propertyCount: z.coerce.number().int().positive().optional().or(z.literal("")),
  estimatedValue: z.coerce.number().positive().optional().or(z.literal("")),
  status: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<FormData>;
  managerId?: string;
}

export default function OutreachForm({ defaultValues, managerId }: Props) {
  const router = useRouter();
  const isEdit = !!managerId;

  const {
    register,
    handleSubmit,
    setFocus,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useUnsavedChanges(isDirty);
  useEffect(() => {
    setFocus("companyName");
  }, [setFocus]);

  const statusValue = watch("status");

  const onSubmit = async (data: FormData) => {
    const url = isEdit ? `/api/outreach/${managerId}` : "/api/outreach";
    const method = isEdit ? "PATCH" : "POST";

    // Clean up numeric fields
    const payload = {
      ...data,
      propertyCount: data.propertyCount ? Number(data.propertyCount) : null,
      estimatedValue: data.estimatedValue ? Number(data.estimatedValue) : null,
      nextFollowUpAt: data.nextFollowUpAt || null,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    const manager = await res.json();
    toast.success(isEdit ? "Prospect updated" : "Prospect added");
    router.push(`/outreach/${manager.id}`);
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-card border rounded-xl shadow-sm p-4 sm:p-6 space-y-6"
    >
      <p className="text-xs text-muted-foreground">
        <span className="text-destructive">*</span> Required
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <RequiredLabel>Company Name</RequiredLabel>
          <Input {...register("companyName")} />
          {errors.companyName && (
            <p className="text-xs text-destructive">
              {errors.companyName.message}
            </p>
          )}
        </div>
        <div className="space-y-1">
          <RequiredLabel>Contact Name</RequiredLabel>
          <Input {...register("contactName")} />
          {errors.contactName && (
            <p className="text-xs text-destructive">
              {errors.contactName.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input
            {...register("phone")}
            type="tel"
            placeholder="(555) 123-4567"
            onChange={(e) => {
              const formatted = formatPhoneInput(e.target.value);
              setValue("phone", formatted, { shouldDirty: true, shouldValidate: true });
            }}
          />
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input {...register("email")} type="email" />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Website</Label>
        <Input {...register("website")} placeholder="https://..." />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Properties Managed</Label>
          <Input
            {...register("propertyCount")}
            type="number"
            min={1}
            placeholder="e.g. 50"
          />
        </div>
        <div className="space-y-1">
          <Label>Est. Annual Value ($)</Label>
          <Input
            {...register("estimatedValue")}
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 15000"
          />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select
            value={statusValue || "PROSPECT"}
            onValueChange={(v) => setValue("status", v, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(OUTREACH_STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Next Follow-Up Date</Label>
        <Input {...register("nextFollowUpAt")} type="date" />
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea
          {...register("notes")}
          rows={4}
          placeholder="Interaction history, key contacts, property details..."
        />
      </div>

      {/* Sticky submit bar on mobile, normal on desktop */}
      <div className="sticky bottom-0 bg-card py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-t md:static md:border-0 md:py-0 md:mx-0 md:px-0">
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 md:h-9 flex-1 md:flex-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Add Prospect"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="h-11 md:h-9"
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
