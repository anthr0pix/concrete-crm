"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RequiredLabel } from "@/components/ui/required-label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceType, JobStatus } from "@prisma/client";
import { SERVICE_TYPE_LABELS, JOB_STATUS_LABELS } from "@/types";
import { cn } from "@/lib/utils";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import NewCustomerDialog from "@/components/customers/NewCustomerDialog";

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
  resealDueDate: z.string().optional(),
  squareFootage: z.coerce.number().optional(),
  notes: z.string().optional(),
  laborHours: z.coerce.number().optional(),
  laborRate: z.coerce.number().optional(),
  materialCost: z.coerce.number().optional(),
  crewAssignment: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface Props {
  customers: Customer[];
  defaultValues?: Partial<FormData>;
  jobId?: string;
}

export default function JobForm({ customers, defaultValues, jobId }: Props) {
  const router = useRouter();
  const isEdit = !!jobId;
  const [customerList, setCustomerList] = useState<Customer[]>(customers);
  const [pendingCustomerId, setPendingCustomerId] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(isEdit);

  const { register, handleSubmit, setValue, watch, control, setFocus, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: "LEAD", serviceType: "CONCRETE_SEALING", ...defaultValues },
  });

  useUnsavedChanges(isDirty);
  useEffect(() => { setFocus("title"); }, [setFocus]);

  const selectedCustomerId = watch("customerId");
  const selectedCustomer = customerList.find((c) => c.id === selectedCustomerId);
  const customerHasAddress = selectedCustomer?.address;

  // Defer setValue until after the new <option> is in the DOM
  useEffect(() => {
    if (pendingCustomerId) {
      setValue("customerId", pendingCustomerId);
      setPendingCustomerId(null);
    }
  }, [pendingCustomerId, customerList, setValue]);

  const fillCustomerAddress = () => {
    if (!selectedCustomer) return;
    if (selectedCustomer.address) setValue("address", selectedCustomer.address);
    if (selectedCustomer.city) setValue("city", selectedCustomer.city);
    if (selectedCustomer.state) setValue("state", selectedCustomer.state);
    if (selectedCustomer.zip) setValue("zip", selectedCustomer.zip);
    toast.success("Address filled from customer");
  };

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
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card border rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
      <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Required</p>

      {/* === ESSENTIAL FIELDS === */}

      {!isEdit && (
        <div className="space-y-1">
          <RequiredLabel>Customer</RequiredLabel>
          <div className="flex gap-2">
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customerList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.lastName}, {c.firstName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <NewCustomerDialog onCustomerCreated={(c) => {
              setCustomerList((prev) => [...prev, c].sort((a, b) => a.lastName.localeCompare(b.lastName)));
              setPendingCustomerId(c.id);
            }} />
          </div>
          {errors.customerId && <p className="text-xs text-destructive">{errors.customerId.message}</p>}
        </div>
      )}

      <div className="space-y-1">
        <RequiredLabel>Job Title</RequiredLabel>
        <Input {...register("title")} placeholder="e.g. Driveway Sealing - Johnson Residence" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1">
        <RequiredLabel>Service Type</RequiredLabel>
        <Controller
          name="serviceType"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select service type..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SERVICE_TYPE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label>Job Address</Label>
          {!isEdit && customerHasAddress && (
            <button
              type="button"
              onClick={fillCustomerAddress}
              className="text-xs text-primary hover:underline font-medium"
            >
              Use customer address
            </button>
          )}
        </div>
        <Input {...register("address")} placeholder="Street address" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <Input {...register("zip")} inputMode="numeric" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Square Footage</Label>
        <Input {...register("squareFootage")} type="number" inputMode="numeric" placeholder="0" />
        <p className="text-xs text-muted-foreground">Total area to be sealed. Used for estimating materials.</p>
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea {...register("notes")} rows={3} placeholder="Internal notes, gate codes, special instructions..." />
        <p className="text-xs text-muted-foreground">Internal only — not shown to the customer.</p>
      </div>

      {/* === MORE DETAILS (collapsible on create, open on edit) === */}

      <div>
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", showMore && "rotate-180")} />
          {showMore ? "Less details" : "More details"}
        </button>
      </div>

      {showMore && (
        <div className="space-y-6">
          <div className="space-y-1">
            <RequiredLabel>Status</RequiredLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(JOB_STATUS_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Scheduled Date</Label>
              <Input {...register("scheduledDate")} type="date" />
            </div>
            <div className="space-y-1">
              <Label>Reseal Due Date</Label>
              <Input {...register("resealDueDate")} type="date" />
            </div>
          </div>

          <div className="border-t pt-4 mt-2">
            <Label className="text-base font-semibold mb-3 block">Cost Breakdown</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Labor Hours</Label>
                <Input {...register("laborHours")} type="number" step="0.5" placeholder="0" />
              </div>
              <div className="space-y-1">
                <Label>Labor Rate ($/hr)</Label>
                <Input {...register("laborRate")} type="number" step="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label>Material Cost ($)</Label>
                <Input {...register("materialCost")} type="number" step="0.01" placeholder="0.00" />
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Label>Crew Assignment</Label>
              <Input {...register("crewAssignment")} placeholder="e.g. Nick + Jake" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={2} placeholder="Brief description of the work..." />
            <p className="text-xs text-muted-foreground">Visible on quotes and invoices sent to the customer.</p>
          </div>
        </div>
      )}

      {/* Sticky submit bar on mobile, normal on desktop */}
      <div className="sticky bottom-0 bg-card py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-t md:static md:border-0 md:py-0 md:mx-0 md:px-0">
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="h-11 md:h-9 flex-1 md:flex-none">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : isEdit ? "Save Changes" : "Create Job"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 md:h-9">Cancel</Button>
        </div>
      </div>
    </form>
  );
}
