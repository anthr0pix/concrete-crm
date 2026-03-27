import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import OutreachForm from "@/components/outreach/OutreachForm";

export const dynamic = "force-dynamic";

export default async function EditOutreachPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const manager = await prisma.propertyManager.findUnique({
    where: { id },
  });

  if (!manager) notFound();

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <h1 className="text-2xl font-bold">Edit Prospect</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {manager.companyName}
        </p>
      </div>
      <OutreachForm
        managerId={id}
        defaultValues={{
          companyName: manager.companyName,
          contactName: manager.contactName,
          phone: manager.phone ?? "",
          email: manager.email ?? "",
          website: manager.website ?? "",
          address: manager.address ?? "",
          city: manager.city ?? "",
          state: manager.state ?? "",
          zip: manager.zip ?? "",
          propertyCount: manager.propertyCount ?? undefined,
          estimatedValue: manager.estimatedValue ?? undefined,
          status: manager.status,
          nextFollowUpAt: manager.nextFollowUpAt
            ? manager.nextFollowUpAt.toISOString().split("T")[0]
            : "",
          notes: manager.notes ?? "",
        }}
      />
    </div>
  );
}
