import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { format } from "date-fns";
import QuoteStatusSelect from "@/components/quotes/QuoteStatusSelect";
import SendQuoteButton from "@/components/quotes/SendQuoteButton";
import ConvertToInvoiceButton from "@/components/quotes/ConvertToInvoiceButton";
import DuplicateQuoteButton from "@/components/quotes/DuplicateQuoteButton";
import DeleteQuoteButton from "@/components/quotes/DeleteQuoteButton";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id },
    include: { customer: true, job: true, lineItems: true, paymentEvents: { orderBy: { createdAt: "desc" } } },
  });
  if (!quote) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Breadcrumbs items={[{ label: "Quotes", href: "/quotes" }, { label: quote.quoteNumber }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{quote.quoteNumber}</h1>
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
        <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl shadow-sm px-3 py-2">
          <QuoteStatusSelect quoteId={quote.id} currentStatus={quote.status} />
          <SendQuoteButton quoteId={quote.id} customerEmail={quote.customer.email} />
          <a href={`/api/quotes/${quote.id}/pdf`} download>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1.5" /> PDF
            </Button>
          </a>
          <div className="hidden sm:block w-px h-6 bg-slate-200" />
          <DuplicateQuoteButton quoteId={quote.id} />
          {quote.status === "ACCEPTED" && (
            <ConvertToInvoiceButton quoteId={quote.id} />
          )}
          <DeleteQuoteButton quoteId={quote.id} />
        </div>
      </div>

      {/* Workflow hint */}
      {quote.status === "DRAFT" && (
        <div className="border-l-4 border-l-amber-400 bg-amber-50 rounded-r-lg px-4 py-3 mb-6 text-sm text-amber-800">
          This quote is still a draft. When you&apos;re ready, use the <strong>Send</strong> button above to email it to the customer.
        </div>
      )}
      {quote.status === "ACCEPTED" && (
        <div className="border-l-4 border-l-green-400 bg-green-50 rounded-r-lg px-4 py-3 mb-6 text-sm text-green-800">
          The customer accepted this quote. Click <strong>&quot;Create Invoice from Quote&quot;</strong> above to bill them.
        </div>
      )}

      {/* Line Items — Desktop Table */}
      <div className="hidden sm:block bg-white rounded-xl shadow-sm overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Description</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Sq Ft</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Price / Sq Ft</th>
              <th className="text-right px-4 py-3 font-medium text-slate-600">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.lineItems.map((item, i) => (
              <tr key={item.id} className={`border-b last:border-0 hover:bg-slate-50/60 transition-colors ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}>
                <td className="px-4 py-3">{item.description}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">${item.unitPrice.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-medium">${item.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Line Items — Mobile Cards */}
      <div className="sm:hidden space-y-3 mb-4">
        {quote.lineItems.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-sm p-4">
            <p className="font-medium text-sm mb-2">{item.description}</p>
            <div className="flex justify-between text-sm text-slate-500">
              <span>{item.quantity} sq ft</span>
              <span>${item.unitPrice.toFixed(2)} / sq ft</span>
              <span className="font-medium text-slate-900">${item.total.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="max-w-xs ml-auto bg-white rounded-xl shadow-sm p-4 space-y-2 mb-6">
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

      {/* Deposit Info */}
      {quote.depositAmount && (
        <div className="bg-blue-50 border-l-4 border-l-blue-400 rounded-r-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 text-sm mb-1">Deposit Required</h3>
          <p className="text-blue-700 text-sm">
            {quote.depositType === "PERCENTAGE"
              ? `${quote.depositAmount}% ($${(quote.total * quote.depositAmount / 100).toFixed(2)})`
              : `$${quote.depositAmount.toFixed(2)}`
            }
            {quote.depositPaid ? (
              <span className="ml-2 inline-flex items-center gap-1 text-green-700 font-semibold">
                Paid {quote.depositPaidAt && format(new Date(quote.depositPaidAt), "MMM d, yyyy")}
              </span>
            ) : (
              <span className="ml-2 text-amber-600 font-medium">Pending</span>
            )}
          </p>
        </div>
      )}

      {/* Meta */}
      <div className="text-sm text-slate-400 space-y-1">
        {quote.validUntil && <p>Valid until: {format(new Date(quote.validUntil), "MMMM d, yyyy")}</p>}
        {quote.notes && <p className="text-slate-600 bg-white rounded-xl shadow-sm p-3 mt-3">{quote.notes}</p>}
      </div>
    </div>
  );
}
