import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import CustomerForm from "@/components/customers/CustomerForm";

export const dynamic = "force-dynamic";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Breadcrumbs items={[
        { label: "Customers", href: "/customers" },
        { label: `${customer.firstName} ${customer.lastName}`, href: `/customers/${id}` },
        { label: "Edit" },
      ]} />
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
