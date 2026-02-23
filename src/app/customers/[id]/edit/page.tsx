import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import CustomerForm from "@/components/customers/CustomerForm";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href={`/customers/${id}`} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">Edit Customer</h1>
      <CustomerForm
        customerId={id}
        defaultValues={{
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          email: customer.email ?? "",
          address: customer.address,
          city: customer.city,
          state: customer.state,
          zip: customer.zip,
          notes: customer.notes ?? "",
          referralSource: customer.referralSource ?? "",
        }}
      />
    </div>
  );
}
