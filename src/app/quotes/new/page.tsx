import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import QuoteBuilder from "@/components/quotes/QuoteBuilder";

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string; jobId?: string }>;
}) {
  const { customerId, jobId } = await searchParams;

  const [customers, jobs] = await Promise.all([
    prisma.customer.findMany({ orderBy: { lastName: "asc" }, select: { id: true, firstName: true, lastName: true } }),
    prisma.job.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true } }),
  ]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/quotes" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Quotes
      </Link>
      <h1 className="text-2xl font-bold mb-6">New Quote</h1>
      <QuoteBuilder customers={customers} jobs={jobs} defaultCustomerId={customerId} defaultJobId={jobId} />
    </div>
  );
}
