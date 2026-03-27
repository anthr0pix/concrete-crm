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
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import { formatPhoneInput } from "@/lib/utils";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  phone: z.string().min(1, "Required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().min(1, "Required"),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  zip: z.string().min(1, "Required"),
  notes: z.string().optional(),
  referralSource: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<FormData>;
  customerId?: string;
}

export default function CustomerForm({ defaultValues, customerId }: Props) {
  const router = useRouter();
  const isEdit = !!customerId;

  const { register, handleSubmit, setFocus, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useUnsavedChanges(isDirty);
  useEffect(() => { setFocus("firstName"); }, [setFocus]);

  const onSubmit = async (data: FormData) => {
    const url = isEdit ? `/api/customers/${customerId}` : "/api/customers";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    const customer = await res.json();
    toast.success(isEdit ? "Customer updated" : "Customer added");
    router.push(`/customers/${customer.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card border rounded-xl shadow-sm p-4 sm:p-6 space-y-6">
      <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Required</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <RequiredLabel>First Name</RequiredLabel>
          <Input {...register("firstName")} />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1">
          <RequiredLabel>Last Name</RequiredLabel>
          <Input {...register("lastName")} />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <RequiredLabel>Phone</RequiredLabel>
          <Input
            {...register("phone")}
            type="tel"
            placeholder="(555) 123-4567"
            onChange={(e) => {
              const formatted = formatPhoneInput(e.target.value);
              setValue("phone", formatted, { shouldDirty: true, shouldValidate: true });
            }}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input {...register("email")} type="email" />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <RequiredLabel>Street Address</RequiredLabel>
        <Input {...register("address")} />
        {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1 col-span-1">
          <RequiredLabel>City</RequiredLabel>
          <Input {...register("city")} />
          {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
        </div>
        <div className="space-y-1">
          <RequiredLabel>State</RequiredLabel>
          <Input {...register("state")} maxLength={2} placeholder="UT" />
          {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
        </div>
        <div className="space-y-1">
          <RequiredLabel>Zip</RequiredLabel>
          <Input {...register("zip")} />
          {errors.zip && <p className="text-xs text-destructive">{errors.zip.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label>How did they hear about you?</Label>
        <Input {...register("referralSource")} placeholder="Google, referral, door hanger..." />
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea {...register("notes")} rows={3} placeholder="Any additional notes..." />
      </div>

      {/* Sticky submit bar on mobile, normal on desktop */}
      <div className="sticky bottom-0 bg-card py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-t md:static md:border-0 md:py-0 md:mx-0 md:px-0">
        <div className="flex gap-3">
          <Button type="submit" disabled={isSubmitting} className="h-11 md:h-9 flex-1 md:flex-none">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : isEdit ? "Save Changes" : "Add Customer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 md:h-9">
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
