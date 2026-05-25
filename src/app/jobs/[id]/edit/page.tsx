import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import JobForm from "@/components/jobs/JobForm";

export const dynamic = "force-dynamic";
import { format } from "date-fns";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [job, customers, propertyManagers] = await Promise.all([
    prisma.job.findUnique({ where: { id } }),
    prisma.customer.findMany({ orderBy: { lastName: "asc" }, select: { id: true, firstName: true, lastName: true } }),
    prisma.propertyManager.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
  ]);
  if (!job) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Breadcrumbs items={[
        { label: "Jobs", href: "/jobs" },
        { label: job.title, href: `/jobs/${id}` },
        { label: "Edit" },
      ]} />
      <h1 className="text-2xl font-bold mb-6">Edit Job</h1>
      <JobForm
        customers={customers}
        propertyManagers={propertyManagers}
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
          resealDueDate: job.resealDueDate ? format(new Date(job.resealDueDate), "yyyy-MM-dd") : "",
          squareFootage: job.squareFootage ?? undefined,
          notes: job.notes ?? "",
          laborHours: job.laborHours ?? undefined,
          laborRate: job.laborRate ?? undefined,
          materialCost: job.materialCost ?? undefined,
          crewAssignment: job.crewAssignment ?? "",
          propertyManagerId: job.propertyManagerId ?? "",
        }}
      />
    </div>
  );
}
