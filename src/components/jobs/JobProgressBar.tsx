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

  const doneCount = steps.filter((s) => s.status === "done").length;
  const currentStep = steps.find((s) => s.status === "current");
  const currentStepIdx = steps.findIndex((s) => s.status === "current");
  const allDone = doneCount === steps.length;

  return (
    <div className="bg-card border rounded-lg px-5 py-4 mb-6">
      {/* Desktop: horizontal steps */}
      <div className="hidden md:flex items-center justify-between">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center min-w-0">
              {step.status === "done" ? (
                <div className="w-7 h-7 rounded-full bg-status-success-bg flex items-center justify-center">
                  <Check className="w-4 h-4 text-status-success-text" />
                </div>
              ) : step.status === "current" ? (
                <div className="w-7 h-7 rounded-full bg-status-info-bg flex items-center justify-center ring-4 ring-status-info-bg/30">
                  <span className="text-xs font-bold text-status-info-text">{i + 1}</span>
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">{i + 1}</span>
                </div>
              )}
              <span
                className={`text-[11px] mt-1.5 text-center leading-tight font-medium ${
                  step.status === "done"
                    ? "text-status-success-text"
                    : step.status === "current"
                      ? "text-status-info-text"
                      : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {step.hint && step.status === "current" && (
                step.href ? (
                  <Link
                    href={step.href}
                    className="text-[10px] text-status-info-text hover:underline mt-0.5"
                  >
                    {step.hint} →
                  </Link>
                ) : (
                  <span className="text-[10px] text-status-info-text mt-0.5">{step.hint}</span>
                )
              )}
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 mx-2 mt-[-16px]">
                <div
                  className={`h-0.5 w-full rounded ${
                    step.status === "done" ? "bg-status-success-bg" : "bg-muted"
                  }`}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile: compact layout */}
      <div className="md:hidden">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {allDone ? steps.length : Math.max(currentStepIdx + 1, doneCount + 1)} of {steps.length}
          </span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${allDone ? "bg-status-success-bg" : "bg-status-info-bg"}`}
              style={{ width: `${(doneCount / steps.length) * 100}%` }}
            />
          </div>
        </div>
        {allDone ? (
          <div className="bg-status-success-bg/20 border border-status-success-bg rounded-lg px-3 py-2 text-sm font-medium text-status-success-text">
            All steps complete
          </div>
        ) : currentStep ? (
          <div className="bg-status-info-bg/20 border border-status-info-bg rounded-lg px-3 py-2">
            <p className="text-sm font-medium text-status-info-text">{currentStep.label}</p>
            {currentStep.hint && (
              currentStep.href ? (
                <Link href={currentStep.href} className="text-xs text-status-info-text hover:underline">
                  {currentStep.hint} →
                </Link>
              ) : (
                <p className="text-xs text-status-info-text">{currentStep.hint}</p>
              )
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
