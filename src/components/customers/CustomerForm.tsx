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

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>First Name</Label>
          <Input {...register("firstName")} />
          {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Last Name</Label>
          <Input {...register("lastName")} />
          {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Phone</Label>
          <Input {...register("phone")} type="tel" />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Email</Label>
          <Input {...register("email")} type="email" />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <Label>Street Address</Label>
        <Input {...register("address")} />
        {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1 col-span-1">
          <Label>City</Label>
          <Input {...register("city")} />
          {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>State</Label>
          <Input {...register("state")} maxLength={2} placeholder="UT" />
          {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
        </div>
        <div className="space-y-1">
          <Label>Zip</Label>
          <Input {...register("zip")} />
          {errors.zip && <p className="text-xs text-red-500">{errors.zip.message}</p>}
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

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Add Customer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
