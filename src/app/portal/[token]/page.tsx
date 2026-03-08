import { verifyPortalToken } from "@/lib/portal-token";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { STATUS_COLORS } from "@/types";
import ApproveQuoteButton from "./ApproveQuoteButton";
import DeclineQuoteButton from "./DeclineQuoteButton";
import PortalPayButton from "@/components/portal/PortalPayButton";

export const dynamic = "force-dynamic";

// Strip auth cookies / don't redirect — this is a public page handled by middleware

async function getQuote(id: string) {
  return prisma.quote.findUnique({
    where: { id },
    include: { customer: true, job: true, lineItems: true },
  });
}

async function getInvoice(id: string) {
  return prisma.invoice.findUnique({
    where: { id },
    include: { customer: true, job: true, quote: true, lineItems: true },
  });
}

export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let payload: { type: "quote" | "invoice"; id: string };
  try {
    payload = await verifyPortalToken(token);
  } catch {
    notFound();
  }

  if (payload.type === "quote") {
    const quote = await getQuote(payload.id);
    if (!quote) notFound();

    // Calculate deposit display amount
    const calculatedDeposit =
      quote.depositAmount && quote.depositType === "PERCENTAGE"
        ? (quote.total * quote.depositAmount) / 100
        : quote.depositAmount ?? 0;
    const depositDisplay = calculatedDeposit.toFixed(2);

    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f4f4f5" }}>
        {/* Header */}
        <header style={{ backgroundColor: "#1a1a2e" }} className="px-6 py-5">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg tracking-wide uppercase">Mountain West Surface</p>
              <p className="text-white/60 text-xs mt-0.5">Professional Surface Cleaning & Sealing</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs">(435) 709-6999</p>
              <p className="text-white/60 text-xs">mwsurfaceco@gmail.com</p>
            </div>
          </div>
        </header>

        {/* Accent bar */}
        <div style={{ backgroundColor: "#e94560", height: 4 }} />

        <main className="max-w-3xl mx-auto px-6 py-10">
          {/* Quote Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Quote</h1>
              <p className="text-gray-500 text-sm mt-1">{quote.quoteNumber}</p>
              <p className="text-gray-700 mt-1">
                Prepared for <strong>{quote.customer.firstName} {quote.customer.lastName}</strong>
              </p>
              {quote.job?.address && (
                <p className="text-gray-500 text-sm mt-0.5">Job: {quote.job.address}</p>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[quote.status] ?? "bg-slate-100 text-slate-600"}`}>
                {quote.status}
              </span>
              <p className="text-gray-400 text-xs mt-2">
                {format(new Date(quote.createdAt), "MMMM d, yyyy")}
              </p>
              {quote.validUntil && (
                <p className="text-gray-400 text-xs mt-1">
                  Valid until {format(new Date(quote.validUntil), "MMMM d, yyyy")}
                </p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "#1a1a2e" }}>
                <tr>
                  <th className="text-left px-5 py-3 text-white/80 font-medium text-xs uppercase tracking-wide">Description</th>
                  <th className="text-right px-5 py-3 text-white/80 font-medium text-xs uppercase tracking-wide">Sq Ft</th>
                  <th className="text-right px-5 py-3 text-white/80 font-medium text-xs uppercase tracking-wide">Price / Sq Ft</th>
                  <th className="text-right px-5 py-3 text-white/80 font-medium text-xs uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 1 ? "bg-gray-50" : ""}>
                    <td className="px-5 py-3.5 text-gray-800">{item.description}</td>
                    <td className="px-5 py-3.5 text-right text-gray-600">{item.quantity}</td>
                    <td className="px-5 py-3.5 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">${item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="max-w-xs ml-auto space-y-2 mb-8">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>${quote.subtotal.toFixed(2)}</span>
            </div>
            {quote.taxRate > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>Tax ({quote.taxRate}%)</span>
                <span>${quote.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-xl border-t pt-3" style={{ borderColor: "#e94560" }}>
              <span className="text-gray-900">Total</span>
              <span style={{ color: "#e94560" }}>${quote.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#e94560" }}>Notes</p>
              <p className="text-gray-700 text-sm leading-relaxed">{quote.notes}</p>
            </div>
          )}

          {/* Approve / Decline / Pay Deposit buttons */}
          {(quote.status === "SENT" || quote.status === "DRAFT") && (
            <>
              {quote.depositAmount && !quote.depositPaid ? (
                <div className="text-center space-y-4">
                  <p className="text-gray-600 text-sm">
                    A deposit of <strong>${depositDisplay}</strong> is required to approve this quote.
                  </p>
                  <PortalPayButton token={token} type="deposit" label="Pay Deposit & Approve" amount={calculatedDeposit} />
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <ApproveQuoteButton token={token} />
                  {quote.status === "SENT" && <DeclineQuoteButton token={token} />}
                </div>
              )}
            </>
          )}

          {quote.status === "ACCEPTED" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
              <p className="text-green-700 font-semibold text-lg">Quote Accepted!</p>
              <p className="text-green-600 text-sm mt-1">We'll be in touch soon to schedule your service.</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-8 mt-12">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <p className="text-gray-500 text-sm">
              <strong className="text-gray-800">Mountain West Surface LLC</strong> ·{" "}
              <a href="tel:+14357096999" className="hover:underline">(435) 709-6999</a> ·{" "}
              <a href="mailto:mwsurfaceco@gmail.com" className="hover:underline">mwsurfaceco@gmail.com</a>
            </p>
            <p className="text-gray-400 text-xs mt-1">mountainwestsurface.com</p>
          </div>
        </footer>
      </div>
    );
  }

  // Invoice
  const invoice = await getInvoice(payload.id);
  if (!invoice) notFound();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4f4f5" }}>
      {/* Header */}
      <header style={{ backgroundColor: "#1a1a2e" }} className="px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-lg tracking-wide uppercase">Mountain West Surface</p>
            <p className="text-white/60 text-xs mt-0.5">Professional Surface Cleaning & Sealing</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">(435) 709-6999</p>
            <p className="text-white/60 text-xs">mwsurfaceco@gmail.com</p>
          </div>
        </div>
      </header>

      <div style={{ backgroundColor: "#e94560", height: 4 }} />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Invoice Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invoice</h1>
            <p className="text-gray-500 text-sm mt-1">{invoice.invoiceNumber}</p>
            <p className="text-gray-700 mt-1">
              Billed to <strong>{invoice.customer.firstName} {invoice.customer.lastName}</strong>
            </p>
            {invoice.job && (
              <p className="text-gray-500 text-sm mt-0.5">Job: {invoice.job.title}</p>
            )}
            {invoice.quote && (
              <p className="text-gray-500 text-sm">Ref: {invoice.quote.quoteNumber}</p>
            )}
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[invoice.status] ?? "bg-slate-100 text-slate-600"}`}>
              {invoice.status}
            </span>
            <p className="text-gray-400 text-xs mt-2">
              {format(new Date(invoice.createdAt), "MMMM d, yyyy")}
            </p>
            {invoice.dueDate && (
              <p className="text-gray-400 text-xs mt-1">
                Due {format(new Date(invoice.dueDate), "MMMM d, yyyy")}
              </p>
            )}
            {invoice.paidDate && (
              <p className="text-green-600 text-xs font-semibold mt-1">
                Paid {format(new Date(invoice.paidDate), "MMMM d, yyyy")}
              </p>
            )}
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: "#1a1a2e" }}>
              <tr>
                <th className="text-left px-5 py-3 text-white/80 font-medium text-xs uppercase tracking-wide">Description</th>
                <th className="text-right px-5 py-3 text-white/80 font-medium text-xs uppercase tracking-wide">Sq Ft</th>
                <th className="text-right px-5 py-3 text-white/80 font-medium text-xs uppercase tracking-wide">Price / Sq Ft</th>
                <th className="text-right px-5 py-3 text-white/80 font-medium text-xs uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, i) => (
                <tr key={item.id} className={i % 2 === 1 ? "bg-gray-50" : ""}>
                  <td className="px-5 py-3.5 text-gray-800">{item.description}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600">{item.quantity}</td>
                  <td className="px-5 py-3.5 text-right text-gray-600">${item.unitPrice.toFixed(2)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-900">${item.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="max-w-xs ml-auto space-y-2 mb-8">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>${invoice.subtotal.toFixed(2)}</span>
          </div>
          {invoice.taxRate > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Tax ({invoice.taxRate}%)</span>
              <span>${invoice.taxAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl border-t pt-3" style={{ borderColor: "#e94560" }}>
            <span className="text-gray-900">Total</span>
            <span style={{ color: "#e94560" }}>${invoice.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 mb-8">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#e94560" }}>Notes</p>
            <p className="text-gray-700 text-sm leading-relaxed">{invoice.notes}</p>
          </div>
        )}

        {/* Payment section */}
        {invoice.status !== "PAID" && invoice.status !== "VOID" && (
          <div className="text-center space-y-3 mb-8">
            <PortalPayButton token={token} type="invoice" label="Pay Now" amount={invoice.total} />
            <p className="text-gray-500 text-sm">
              Or call <a href="tel:+14357096999" className="font-semibold hover:underline">(435) 709-6999</a> to arrange payment.
            </p>
          </div>
        )}

        {invoice.status === "PAID" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
            <p className="text-green-700 font-semibold text-lg">Paid in Full — Thank You!</p>
            <p className="text-green-600 text-sm mt-1">We appreciate your business with Mountain West Surface.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm">
            <strong className="text-gray-800">Mountain West Surface LLC</strong> ·{" "}
            <a href="tel:+14357096999" className="hover:underline">(435) 709-6999</a> ·{" "}
            <a href="mailto:mwsurfaceco@gmail.com" className="hover:underline">mwsurfaceco@gmail.com</a>
          </p>
          <p className="text-gray-400 text-xs mt-1">mountainwestsurface.com</p>
        </div>
      </footer>
    </div>
  );
}
