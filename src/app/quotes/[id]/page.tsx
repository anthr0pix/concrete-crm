import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { QUOTE_STATUS_LABELS } from "@/types";
import { format } from "date-fns";
import QuoteStatusSelect from "@/components/quotes/QuoteStatusSelect";
import ConvertToInvoiceButton from "@/components/quotes/ConvertToInvoiceButton";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, job: true, lineItems: true },
  });
  if (!quote) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/quotes" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Quotes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{quote.quoteNumber}</h1>
          <p className="text-slate-500 text-sm mt-1">
            <Link href={`/customers/${quote.customer.id}`} className="hover:underline">
              {quote.customer.firstName} {quote.customer.lastName}
            </Link>
            {" · "}{format(new Date(quote.createdAt), "MMM d, yyyy")}
          </p>
          {quote.job && (
            <p className="text-sm text-slate-400 mt-0.5">
              Job: <Link href={`/jobs/${quote.job.id}`} className="hover:underline">{quote.job.title}</Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <QuoteStatusSelect quoteId={quote.id} currentStatus={quote.status} />
          {quote.status === "ACCEPTED" && (
            <ConvertToInvoiceButton quoteId={quote.id} />
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white border rounded-lg overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Description</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Qty</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Unit Price</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.lineItems.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="max-w-xs ml-auto space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span>${quote.subtotal.toFixed(2)}</span>
        </div>
        {quote.taxRate > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax ({quote.taxRate}%)</span>
              <span>${quote.taxAmount.toFixed(2)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total</span>
          <span>${quote.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="text-sm text-slate-400 space-y-1">
        {quote.validUntil && <p>Valid until: {format(new Date(quote.validUntil), "MMMM d, yyyy")}</p>}
        {quote.notes && <p className="text-slate-600 bg-slate-50 rounded p-3 mt-3">{quote.notes}</p>}
      </div>
    </div>
  );
}
