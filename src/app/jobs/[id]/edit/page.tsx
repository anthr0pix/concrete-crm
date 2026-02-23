import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import JobForm from "@/components/jobs/JobForm";
import { format } from "date-fns";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [job, customers] = await Promise.all([
    prisma.job.findUnique({ where: { id } }),
    prisma.customer.findMany({ orderBy: { lastName: "asc" }, select: { id: true, firstName: true, lastName: true } }),
  ]);
  if (!job) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href={`/jobs/${id}`} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold mb-6">Edit Job</h1>
      <JobForm
        customers={customers}
        jobId={id}
        defaultValues={{
          customerId: job.customerId,
          title: job.title,
          description: job.description ?? "",
          serviceType: job.serviceType,
          status: job.status,
          address: job.address ?? "",
          city: job.city ?? "",
          state: job.state ?? "",
          zip: job.zip ?? "",
          scheduledDate: job.scheduledDate ? format(new Date(job.scheduledDate), "yyyy-MM-dd") : "",
          squareFootage: job.squareFootage ?? undefined,
          notes: job.notes ?? "",
        }}
      />
    </div>
  );
}
