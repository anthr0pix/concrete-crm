import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import QuoteBuilder from "@/components/quotes/QuoteBuilder";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quote, customers, jobs] = await Promise.all([
    prisma.quote.findUnique({ where: { id }, include: { lineItems: true } }),
    prisma.customer.findMany({ orderBy: { lastName: "asc" }, select: { id: true, firstName: true, lastName: true } }),
    prisma.job.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true } }),
  ]);
  if (!quote) notFound();
  if (quote.status !== "DRAFT") redirect(`/quotes/${id}`);

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Breadcrumbs items={[
        { label: "Quotes", href: "/quotes" },
        { label: quote.quoteNumber, href: `/quotes/${id}` },
        { label: "Edit" },
      ]} />
      <h1 className="text-2xl font-bold mb-6">Edit Quote</h1>
      <QuoteBuilder
        customers={customers}
        jobs={jobs}
        quoteId={id}
        defaultCustomerId={quote.customerId}
        defaultJobId={quote.jobId ?? undefined}
        defaultLineItems={quote.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }))}
        defaultTaxRate={quote.taxRate}
        defaultNotes={quote.notes ?? ""}
        defaultValidUntil={quote.validUntil ? format(new Date(quote.validUntil), "yyyy-MM-dd") : ""}
        defaultDepositAmount={quote.depositAmount}
        defaultDepositType={quote.depositType}
      />
    </div>
  );
}
