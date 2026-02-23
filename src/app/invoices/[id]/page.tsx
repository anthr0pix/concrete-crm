import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { INVOICE_STATUS_LABELS } from "@/types";
import { format } from "date-fns";
import InvoiceStatusSelect from "@/components/invoices/InvoiceStatusSelect";
import MarkPaidButton from "@/components/invoices/MarkPaidButton";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, job: true, quote: true, lineItems: true },
  });
  if (!invoice) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/invoices" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Invoices
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{invoice.invoiceNumber}</h1>
          <p className="text-slate-500 text-sm mt-1">
            <Link href={`/customers/${invoice.customer.id}`} className="hover:underline">
              {invoice.customer.firstName} {invoice.customer.lastName}
            </Link>
            {" · "}{format(new Date(invoice.createdAt), "MMM d, yyyy")}
          </p>
          {invoice.dueDate && (
            <p className="text-sm text-slate-400">Due: {format(new Date(invoice.dueDate), "MMMM d, yyyy")}</p>
          )}
          {invoice.paidDate && (
            <p className="text-sm text-green-600 font-medium">Paid: {format(new Date(invoice.paidDate), "MMMM d, yyyy")}</p>
          )}
          {invoice.job && (
            <p className="text-sm text-slate-400 mt-0.5">
              Job: <Link href={`/jobs/${invoice.job.id}`} className="hover:underline">{invoice.job.title}</Link>
            </p>
          )}
          {invoice.quote && (
            <p className="text-sm text-slate-400">
              From: <Link href={`/quotes/${invoice.quote.id}`} className="hover:underline">{invoice.quote.quoteNumber}</Link>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <InvoiceStatusSelect invoiceId={invoice.id} currentStatus={invoice.status} />
          {invoice.status !== "PAID" && invoice.status !== "VOID" && (
            <MarkPaidButton invoiceId={invoice.id} />
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
            {invoice.lineItems.map((item) => (
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
          <span>${invoice.subtotal.toFixed(2)}</span>
        </div>
        {invoice.taxRate > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tax ({invoice.taxRate}%)</span>
            <span>${invoice.taxAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total</span>
          <span>${invoice.total.toFixed(2)}</span>
        </div>
      </div>

      {invoice.notes && (
        <p className="text-sm text-slate-600 bg-slate-50 rounded p-3">{invoice.notes}</p>
      )}
    </div>
  );
}
