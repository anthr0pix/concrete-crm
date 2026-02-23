"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ServiceType, JobStatus } from "@prisma/client";
import { SERVICE_TYPE_LABELS, JOB_STATUS_LABELS } from "@/types";

const schema = z.object({
  customerId: z.string().min(1, "Required"),
  title: z.string().min(1, "Required"),
  description: z.string().optional(),
  serviceType: z.nativeEnum(ServiceType),
  status: z.nativeEnum(JobStatus),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  scheduledDate: z.string().optional(),
  squareFootage: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Customer { id: string; firstName: string; lastName: string }

interface Props {
  customers: Customer[];
  defaultValues?: Partial<FormData>;
  jobId?: string;
}

export default function JobForm({ customers, defaultValues, jobId }: Props) {
  const router = useRouter();
  const isEdit = !!jobId;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "LEAD", serviceType: "CONCRETE_SEALING", ...defaultValues },
  });

  const onSubmit = async (data: FormData) => {
    const url = isEdit ? `/api/jobs/${jobId}` : "/api/jobs";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) { toast.error("Something went wrong."); return; }

    const job = await res.json();
    toast.success(isEdit ? "Job updated" : "Job created");
    router.push(`/jobs/${job.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {!isEdit && (
        <div className="space-y-1">
          <Label>Customer</Label>
          <select {...register("customerId")} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
            <option value="">Select a customer...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>
            ))}
          </select>
          {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
        </div>
      )}

      <div className="space-y-1">
        <Label>Job Title</Label>
        <Input {...register("title")} placeholder="e.g. Driveway Sealing - Johnson Residence" />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Service Type</Label>
          <select {...register("serviceType")} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
            {Object.entries(SERVICE_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <select {...register("status")} className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900">
            {Object.entries(JOB_STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Scheduled Date</Label>
          <Input {...register("scheduledDate")} type="date" />
        </div>
        <div className="space-y-1">
          <Label>Square Footage</Label>
          <Input {...register("squareFootage")} type="number" placeholder="0" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Job Address (if different from customer)</Label>
        <Input {...register("address")} placeholder="Street address" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1 col-span-1">
          <Label>City</Label>
          <Input {...register("city")} />
        </div>
        <div className="space-y-1">
          <Label>State</Label>
          <Input {...register("state")} maxLength={2} placeholder="UT" />
        </div>
        <div className="space-y-1">
          <Label>Zip</Label>
          <Input {...register("zip")} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Description</Label>
        <Textarea {...register("description")} rows={2} placeholder="Brief description of the work..." />
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea {...register("notes")} rows={3} placeholder="Internal notes, gate codes, special instructions..." />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Job"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
