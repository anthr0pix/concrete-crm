import Link from "next/link";
import { Check } from "lucide-react";

interface JobProgressBarProps {
  jobStatus: string;
  scheduledDate: Date | null;
  quotes: Array<{ id: string; status: string }>;
  invoices: Array<{ id: string; status: string }>;
  jobId: string;
  customerId: string;
}

interface Step {
  key: string;
  label: string;
  status: "done" | "current" | "upcoming";
  hint?: string;
  href?: string;
}

export default function JobProgressBar({
  jobStatus,
  scheduledDate,
  quotes,
  invoices,
  jobId,
  customerId,
}: JobProgressBarProps) {
  if (jobStatus === "CANCELLED") return null;

  // Derive state from related records
  const hasQuote = quotes.length > 0;
  const bestQuote = quotes[0]; // most recent
  const quoteSent = hasQuote && ["SENT", "ACCEPTED", "DECLINED"].includes(bestQuote.status);
  const quoteAccepted = hasQuote && bestQuote.status === "ACCEPTED";
  const hasInvoice = invoices.length > 0;
  const bestInvoice = invoices[0];
  const invoiceSent = hasInvoice && ["SENT", "PAID", "OVERDUE"].includes(bestInvoice.status);
  const invoicePaid = hasInvoice && bestInvoice.status === "PAID";
  const isScheduled = !!scheduledDate || ["SCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(jobStatus);
  const isCompleted = jobStatus === "COMPLETED";

  // Build steps with smart status detection
  const steps: Step[] = [
    {
      key: "quote",
      label: "Quote Created",
      status: hasQuote ? "done" : "upcoming",
      ...(!hasQuote && {
        hint: "Create a quote",
        href: `/quotes/new?jobId=${jobId}&customerId=${customerId}`,
      }),
    },
    {
      key: "sent",
      label: "Quote Sent",
      status: quoteSent ? "done" : hasQuote && !quoteSent ? "current" : "upcoming",
      ...(hasQuote && !quoteSent && {
        hint: "Open quote to send",
        href: `/quotes/${bestQuote.id}`,
      }),
    },
    {
      key: "accepted",
      label: "Customer Accepted",
      status: quoteAccepted ? "done" : quoteSent && !quoteAccepted ? "current" : "upcoming",
      ...(quoteSent && !quoteAccepted && {
        hint: "Waiting on customer",
      }),
    },
    {
      key: "scheduled",
      label: "Scheduled",
      status: isScheduled ? "done" : quoteAccepted ? "current" : "upcoming",
      ...(quoteAccepted && !isScheduled && {
        hint: "Set a date",
        href: `/jobs/${jobId}/edit`,
      }),
    },
    {
      key: "invoiced",
      label: "Invoice Sent",
      status: invoiceSent ? "done" : isScheduled && !invoiceSent ? "current" : "upcoming",
      ...(isScheduled && !hasInvoice && quoteAccepted && {
        hint: "Create invoice from quote",
        href: `/quotes/${bestQuote.id}`,
      }),
      ...(hasInvoice && !invoiceSent && {
        hint: "Open invoice to send",
        href: `/invoices/${bestInvoice.id}`,
      }),
    },
    {
      key: "paid",
      label: "Paid",
      status: invoicePaid ? "done" : invoiceSent && !invoicePaid ? "current" : "upcoming",
      ...(invoiceSent && !invoicePaid && {
        hint: "Waiting on payment",
        href: `/invoices/${bestInvoice.id}`,
      }),
    },
  ];

  // Find the current step index for the active marker
  const currentIdx = steps.findIndex((s) => s.status === "current");

  return (
    <div className="bg-white border rounded-lg px-5 py-4 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center min-w-0">
              {step.status === "done" ? (
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
              ) : step.status === "current" ? (
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center ring-4 ring-blue-100">
                  <span className="text-xs font-bold text-white">{i + 1}</span>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-xs font-medium text-slate-400">{i + 1}</span>
                </div>
              )}
              <span
                className={`text-[11px] mt-1.5 text-center leading-tight font-medium ${
                  step.status === "done"
                    ? "text-green-700"
                    : step.status === "current"
                      ? "text-blue-700"
                      : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
              {step.hint && step.status === "current" && (
                step.href ? (
                  <Link
                    href={step.href}
                    className="text-[10px] text-blue-600 hover:underline mt-0.5"
                  >
                    {step.hint} →
                  </Link>
                ) : (
                  <span className="text-[10px] text-blue-500 mt-0.5">{step.hint}</span>
                )
              )}
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 mx-2 mt-[-16px]">
                <div
                  className={`h-0.5 w-full rounded ${
                    step.status === "done" ? "bg-green-300" : "bg-slate-200"
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
