"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExpenseCategory } from "@prisma/client";
import { EXPENSE_CATEGORY_LABELS } from "@/types";

const schema = z.object({
  date: z.string().min(1, "Required"),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1, "Required"),
  amount: z.coerce.number().positive("Must be greater than 0"),
  vendor: z.string().optional(),
  receiptUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  jobId: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  jobs: Array<{ id: string; title: string }>;
  defaultValues?: Partial<FormData>;
  expenseId?: string;
}

export default function ExpenseForm({ jobs, defaultValues, expenseId }: Props) {
  const router = useRouter();
  const isEdit = !!expenseId;

  const {
    register,
    handleSubmit,
    control,
    setFocus,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "MATERIALS",
      date: new Date().toISOString().split("T")[0],
      ...defaultValues,
    },
  });

  useUnsavedChanges(isDirty);
  useEffect(() => { setFocus("description"); }, [setFocus]);

  const onSubmit = async (data: FormData) => {
    const url = isEdit ? `/api/expenses/${expenseId}` : "/api/expenses";
    const method = isEdit ? "PATCH" : "POST";

    // Clean up empty optional strings
    const payload = {
      ...data,
      amount: Number(data.amount),
      vendor: data.vendor || undefined,
      receiptUrl: data.receiptUrl || undefined,
      jobId: data.jobId || undefined,
      notes: data.notes || undefined,
    };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      toast.error("Something went wrong.");
      return;
    }

    toast.success(isEdit ? "Expense updated" : "Expense created");
    router.push("/expenses");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Date</Label>
          <Input {...register("date")} type="date" />
          {errors.date && (
            <p className="text-xs text-destructive">{errors.date.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_CATEGORY_LABELS).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Description</Label>
        <Input
          {...register("description")}
          placeholder="e.g. 5-gallon sealer, diesel fuel"
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              {...register("amount")}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="pl-7"
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-destructive">{errors.amount.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label>Vendor</Label>
          <Input
            {...register("vendor")}
            placeholder="e.g. Home Depot, Shell"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Link to Job (optional)</Label>
        <Controller
          name="jobId"
          control={control}
          render={({ field }) => (
            <Select onValueChange={(v) => field.onChange(v === "none" ? "" : v)} value={field.value || "none"}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="None — general business expense" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None — general business expense</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <p className="text-xs text-muted-foreground">Link this expense to a specific job to track job-level costs.</p>
      </div>

      <div className="space-y-1">
        <Label>Receipt Link (optional)</Label>
        <Input
          {...register("receiptUrl")}
          type="url"
          placeholder="https://..."
        />
        <p className="text-xs text-muted-foreground">Paste a link to a photo or scan of the receipt, if you have one.</p>
        {errors.receiptUrl && (
          <p className="text-xs text-destructive">{errors.receiptUrl.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea
          {...register("notes")}
          rows={3}
          placeholder="Additional notes..."
        />
      </div>

      {/* Sticky submit bar on mobile, normal on desktop */}
      <div className="sticky bottom-0 bg-background py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-t md:static md:border-0 md:py-0 md:mx-0 md:px-0">
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="h-11 md:h-9 flex-1 md:flex-none">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : isEdit ? "Save Changes" : "Add Expense"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 md:h-9">
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
