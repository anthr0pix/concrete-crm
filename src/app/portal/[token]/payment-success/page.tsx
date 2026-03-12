import { verifyPortalToken } from "@/lib/portal-token";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaymentSuccessPage({
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

  let title: string;
  let subtitle: string;
  let detail: string;

  if (payload.type === "invoice") {
    const invoice = await prisma.invoice.findUnique({
      where: { id: payload.id },
    });
    if (!invoice) notFound();

    title = "Payment Successful!";
    subtitle = `Invoice ${invoice.invoiceNumber}`;
    detail = `$${invoice.total.toFixed(2)}`;
  } else {
    const quote = await prisma.quote.findUnique({
      where: { id: payload.id },
    });
    if (!quote) notFound();

    // Calculate the deposit amount for display
    const depositDollars =
      quote.depositAmount && quote.depositType === "PERCENTAGE"
        ? quote.total * quote.depositAmount / 100
        : quote.depositAmount ?? 0;

    title = "Deposit Received!";
    subtitle = `Quote ${quote.quoteNumber}`;
    detail = `$${depositDollars.toFixed(2)}`;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[var(--mws-navy)] px-6 py-5">
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
      <div className="bg-primary h-1" />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Success box */}
        <div className="bg-status-success-bg border border-status-success-text/20 rounded-xl p-8 text-center">
          {/* Check icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-status-success-bg">
            <svg
              className="h-8 w-8 text-status-success-text"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-status-success-text mb-2">{title}</h1>
          <p className="text-status-success-text/80 text-sm mb-1">{subtitle}</p>
          <p className="text-status-success-text text-xl font-semibold mb-4">{detail}</p>

          <p className="text-status-success-text/70 text-sm leading-relaxed max-w-md mx-auto">
            Thank you for your payment. We&apos;ll be in touch soon to confirm details and schedule your service.
          </p>
        </div>

        {/* Back to portal link */}
        <div className="text-center mt-8">
          <Link
            href={`/portal/${token}`}
            className="inline-block px-6 py-2.5 text-sm font-medium rounded-lg transition-colors bg-[var(--mws-navy)] text-white"
          >
            Back to Portal
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-muted-foreground text-sm">
            <strong className="text-foreground">Mountain West Surface LLC</strong> ·{" "}
            <a href="tel:+14357096999" className="hover:underline">(435) 709-6999</a> ·{" "}
            <a href="mailto:mwsurfaceco@gmail.com" className="hover:underline">mwsurfaceco@gmail.com</a>
          </p>
          <p className="text-muted-foreground/50 text-xs mt-1">mountainwestsurface.com</p>
        </div>
      </footer>
    </div>
  );
}
