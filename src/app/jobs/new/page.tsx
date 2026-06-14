import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import JobForm from "@/components/jobs/JobForm";

export const dynamic = "force-dynamic";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; propertyManagerId?: string }>;
}) {
  const { customerId, propertyManagerId } = await searchParams;
  const [customers, propertyManagers] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { lastName: "asc" },
      select: { id: true, firstName: true, lastName: true, address: true, city: true, state: true, zip: true, phone: true },
    }),
    prisma.propertyManager.findMany({
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true },
    }),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Link href="/jobs" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Jobs
      </Link>
      <h1 className="text-2xl font-bold mb-6">New Job</h1>
      <JobForm
        customers={customers}
        propertyManagers={propertyManagers}
        defaultValues={{ customerId: customerId ?? "", propertyManagerId: propertyManagerId ?? "" }}
      />
    </div>
  );
}
