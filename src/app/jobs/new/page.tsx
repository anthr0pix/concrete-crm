import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import JobForm from "@/components/jobs/JobForm";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const customers = await prisma.customer.findMany({
    orderBy: { lastName: "asc" },
    select: { id: true, firstName: true, lastName: true },
  });

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/jobs" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Jobs
      </Link>
      <h1 className="text-2xl font-bold mb-6">New Job</h1>
      <JobForm customers={customers} defaultValues={{ customerId: customerId ?? "" }} />
    </div>
  );
}
