import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { format } from "date-fns";
import InvoiceStatusSelect from "@/components/invoices/InvoiceStatusSelect";
import SendInvoiceButton from "@/components/invoices/SendInvoiceButton";
import MarkPaidButton from "@/components/invoices/MarkPaidButton";
import PayNowButton from "@/components/invoices/PayNowButton";
import DuplicateInvoiceButton from "@/components/invoices/DuplicateInvoiceButton";
import DeleteInvoiceButton from "@/components/invoices/DeleteInvoiceButton";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, job: true, quote: true, lineItems: true, paymentEvents: { orderBy: { createdAt: "desc" } } },
  });
  if (!invoice) notFound();

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Breadcrumbs items={[{ label: "Invoices", href: "/invoices" }, { label: invoice.invoiceNumber }]} />

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
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
            <p className="text-sm text-green-600 font-medium">
              Paid: {format(new Date(invoice.paidDate), "MMMM d, yyyy")}
              {invoice.squarePaymentId && (
                <span className="ml-2 inline-flex items-center text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  Paid via Square
                </span>
              )}
            </p>
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
        <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl shadow-sm px-3 py-2">
          <InvoiceStatusSelect invoiceId={invoice.id} currentStatus={invoice.status} />
          <SendInvoiceButton invoiceId={invoice.id} customerEmail={invoice.customer.email} />
          <a href={`/api/invoices/${invoice.id}/pdf`} download>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1.5" /> PDF
            </Button>
          </a>
          <div className="hidden sm:block w-px h-6 bg-slate-200" />
          <DuplicateInvoiceButton invoiceId={invoice.id} />
          {invoice.status !== "PAID" && invoice.status !== "VOID" && (
            <>
              <MarkPaidButton invoiceId={invoice.id} />
              <PayNowButton invoiceId={invoice.id} />
            </>
          )}
          <DeleteInvoiceButton invoiceId={invoice.id} />
        </div>
      </div>

      {/* Workflow hint */}
      {invoice.status === "DRAFT" && (
        <div className="border-l-4 border-l-amber-400 bg-amber-50 rounded-r-lg px-4 py-3 mb-6 text-sm text-amber-800">
          This invoice is still a draft. Use the <strong>Send Invoice</strong> button above to email it to the customer.
        </div>
      )}
      {invoice.status === "SENT" && (
        <div className="border-l-4 border-l-blue-400 bg-blue-50 rounded-r-lg px-4 py-3 mb-6 text-sm text-blue-800">
          This invoice has been sent. Use <strong>&quot;Copy Payment Link&quot;</strong> to share a payment link, or <strong>&quot;Mark as Paid&quot;</strong> if the customer paid by cash or check.
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
            {invoice.lineItems.map((item, i) => (
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
        {invoice.lineItems.map((item) => (
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
        <p className="text-sm text-slate-600 bg-white rounded-xl shadow-sm p-3">{invoice.notes}</p>
      )}

      {invoice.paymentEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 mt-4">
          <div className="flex items-center gap-2 mb-3 border-b pb-2">
            <h2 className="font-semibold text-base">Payment History</h2>
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{invoice.paymentEvents.length}</span>
          </div>
          <div className="space-y-2">
            {invoice.paymentEvents.map((event: { id: string; eventType: string; createdAt: Date; amount: number; status: string }) => (
              <div key={event.id} className="flex justify-between items-center text-sm border-b last:border-0 pb-2 hover:bg-slate-50 transition-colors rounded px-1">
                <div>
                  <span className="font-medium">{event.eventType.split(".").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</span>
                  <span className="text-slate-400 ml-2">{format(new Date(event.createdAt), "MMM d, yyyy h:mm a")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">${event.amount.toFixed(2)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    event.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                    event.status === "FAILED" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>{event.status.charAt(0) + event.status.slice(1).toLowerCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
