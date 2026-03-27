import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, MapPin, Calendar, Ruler, Phone, Navigation, FileText, Receipt, Camera, DollarSign, Clock } from "lucide-react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { SERVICE_TYPE_LABELS } from "@/types";
import { formatPhone } from "@/lib/utils";
import { format } from "date-fns";
import PhotoUpload from "@/components/jobs/PhotoUpload";
import JobDetailActions from "@/components/jobs/JobDetailActions";
import JobCostingSection from "@/components/jobs/JobCostingSection";
import JobProgressBar from "@/components/jobs/JobProgressBar";
import MarkCompleteButton from "@/components/jobs/MarkCompleteButton";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      customer: true,
      photos: { orderBy: { createdAt: "asc" } },
      quotes: { orderBy: { createdAt: "desc" } },
      invoices: { orderBy: { createdAt: "desc" } },
      expenses: { orderBy: { date: "desc" } },
    },
  });

  if (!job) notFound();

  const jobAddress = job.address
    ? `${job.address}, ${job.city}, ${job.state} ${job.zip}`
    : `${job.customer.address}, ${job.customer.city}, ${job.customer.state} ${job.customer.zip}`;

  const INFO_CARD_BORDERS: Record<string, string> = {
    Customer: "border-t-blue-400",
    Scheduled: "border-t-yellow-400",
    Location: "border-t-green-400",
    "Square Feet": "border-t-orange-400",
    "Reseal Due": "border-t-red-400",
    "Review Request": "border-t-purple-400",
    Submitted: "border-t-slate-400",
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: "Jobs", href: "/jobs" }, { label: job.title }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{job.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{SERVICE_TYPE_LABELS[job.serviceType]}</p>
        </div>
        <JobDetailActions jobId={job.id} currentStatus={job.status} />
      </div>

      {/* Quick actions — all jobs with address/phone */}
      {(job.customer.phone || jobAddress) && (
        <div className="flex flex-wrap items-center gap-3 bg-card border rounded-xl shadow-sm px-4 py-3 mb-6">
          {(job.status === "SCHEDULED" || job.status === "IN_PROGRESS") && (
            <MarkCompleteButton jobId={job.id} />
          )}
          {job.customer.phone && (
            <a href={`tel:${job.customer.phone}`}>
              <Button size="sm" variant="outline">
                <Phone className="w-4 h-4 mr-1.5" /> {formatPhone(job.customer.phone)}
              </Button>
            </a>
          )}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(jobAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" variant="outline">
              <Navigation className="w-4 h-4 mr-1.5" /> Directions
            </Button>
          </a>
        </div>
      )}

      {/* Next-step prompts */}
      {job.status === "LEAD" && job.quotes.length === 0 && (
        <div className="border-l-4 border-l-purple-400 bg-status-purple-bg rounded-r-lg px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-status-purple-text">
            <FileText className="w-4 h-4 shrink-0" />
            <span>New lead — ready to send a quote?</span>
          </div>
          <Link href={`/quotes/new?customerId=${job.customer.id}&jobId=${job.id}`}>
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
              Create Quote
            </Button>
          </Link>
        </div>
      )}
      {job.status === "COMPLETED" && job.invoices.length === 0 && (
        <div className="border-l-4 border-l-green-400 bg-status-success-bg rounded-r-lg px-4 py-3 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-status-success-text">
            <Receipt className="w-4 h-4 shrink-0" />
            <span>Job complete — time to get paid!</span>
          </div>
          <Link href={`/invoices/new?customerId=${job.customer.id}&jobId=${job.id}`}>
            <Button size="sm" className="bg-status-success-text text-white hover:bg-status-success-text/90">
              Create Invoice
            </Button>
          </Link>
        </div>
      )}

      {/* Workflow progress */}
      <JobProgressBar
        jobStatus={job.status}
        scheduledDate={job.scheduledDate}
        quotes={job.quotes.map((q) => ({ id: q.id, status: q.status }))}
        invoices={job.invoices.map((inv) => ({ id: inv.id, status: inv.status }))}
        jobId={job.id}
        customerId={job.customer.id}
      />

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className={`bg-card rounded-xl shadow-sm border-t-2 ${INFO_CARD_BORDERS["Customer"]} p-4`}>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><User className="w-3.5 h-3.5" /> Customer</div>
          <Link href={`/customers/${job.customer.id}`} className="font-medium text-sm hover:underline">
            {job.customer.firstName} {job.customer.lastName}
          </Link>
        </div>
        <div className={`bg-card rounded-xl shadow-sm border-t-2 ${INFO_CARD_BORDERS["Submitted"]} p-4`}>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><Clock className="w-3.5 h-3.5" /> Submitted</div>
          <p className="font-medium text-sm">{format(new Date(job.createdAt), "MMM d, yyyy")}</p>
        </div>
        <div className={`bg-card rounded-xl shadow-sm border-t-2 ${INFO_CARD_BORDERS["Scheduled"]} p-4`}>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><Calendar className="w-3.5 h-3.5" /> Scheduled</div>
          <p className="font-medium text-sm">
            {job.scheduledDate ? format(new Date(job.scheduledDate), "MMM d, yyyy") : "Not set"}
          </p>
        </div>
        <div className={`bg-card rounded-xl shadow-sm border-t-2 ${INFO_CARD_BORDERS["Location"]} p-4`}>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><MapPin className="w-3.5 h-3.5" /> Location</div>
          <p className="font-medium text-xs leading-tight">{jobAddress}</p>
        </div>
        <div className={`bg-card rounded-xl shadow-sm border-t-2 ${INFO_CARD_BORDERS["Square Feet"]} p-4`}>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1"><Ruler className="w-3.5 h-3.5" /> Square Feet</div>
          <p className="font-medium text-sm">{job.squareFootage ? `${job.squareFootage.toLocaleString()} sq ft` : "\u2014"}</p>
        </div>
        {job.resealDueDate && (
          <div className={`bg-card rounded-xl shadow-sm border-t-2 ${INFO_CARD_BORDERS["Reseal Due"]} p-4`}>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" /> Reseal Due
            </div>
            <p className={`font-medium text-sm ${new Date(job.resealDueDate) < new Date() ? "text-status-danger-text" : ""}`}>
              {format(new Date(job.resealDueDate), "MMM d, yyyy")}
            </p>
          </div>
        )}
        {job.reviewRequestSentAt && (
          <div className={`bg-card rounded-xl shadow-sm border-t-2 ${INFO_CARD_BORDERS["Review Request"]} p-4`}>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">Review Request</div>
            <p className="font-medium text-sm text-status-success-text">
              Sent {format(new Date(job.reviewRequestSentAt), "MMM d, yyyy")}
            </p>
          </div>
        )}
      </div>

      {/* Job Costing */}
      <div className="mb-6">
        <JobCostingSection job={job} />
      </div>

      {/* Notes */}
      {job.notes && (
        <div className="bg-status-amber-bg border-l-4 border-l-amber-400 rounded-r-lg px-4 py-3 mb-6 text-sm text-status-amber-text">
          <span className="font-medium">Notes: </span>{job.notes}
        </div>
      )}

      {/* Photos */}
      <div className="bg-card border rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4 border-b pb-2">
          <h2 className="font-semibold text-base">Photos</h2>
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{job.photos.length}</span>
        </div>
        {job.photos.length === 0 ? (
          <div className="text-center py-6">
            <Camera className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No photos yet</p>
          </div>
        ) : null}
        <PhotoUpload jobId={job.id} photos={job.photos} />
      </div>

      {/* Expenses */}
      <div className="bg-card border rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">Expenses</h2>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{job.expenses.length}</span>
          </div>
          <Link href={`/expenses/new?jobId=${job.id}`}>
            <Button size="sm" variant="outline">+ Add Expense</Button>
          </Link>
        </div>
        {job.expenses.length === 0 ? (
          <div className="text-center py-6">
            <DollarSign className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No expenses recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {job.expenses.map((exp) => (
              <div key={exp.id} className="flex justify-between text-sm py-1.5 border-b last:border-0 hover:bg-muted transition-colors rounded px-1">
                <div>
                  <span className="font-medium">{exp.description}</span>
                  <span className="text-muted-foreground ml-2">{format(new Date(exp.date), "MMM d")}</span>
                </div>
                <span className="font-medium">${exp.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quotes & Invoices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base">Quotes</h2>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{job.quotes.length}</span>
            </div>
            <Link href={`/quotes/new?jobId=${job.id}`}>
              <Button size="sm" variant="outline">+ New Quote</Button>
            </Link>
          </div>
          {job.quotes.length === 0 ? (
            <div className="text-center py-6">
              <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No quotes yet</p>
            </div>
          ) : (
            job.quotes.map((q) => (
              <Link key={q.id} href={`/quotes/${q.id}`}>
                <div className="flex justify-between text-sm py-1.5 border-b last:border-0 hover:bg-muted transition-colors rounded px-1">
                  <span>{q.quoteNumber}</span>
                  <span className="font-medium">${q.total.toFixed(2)}</span>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3 border-b pb-2">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base">Invoices</h2>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{job.invoices.length}</span>
            </div>
            <Link href={`/invoices/new?jobId=${job.id}`}>
              <Button size="sm" variant="outline">+ New Invoice</Button>
            </Link>
          </div>
          {job.invoices.length === 0 ? (
            <div className="text-center py-6">
              <Receipt className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            </div>
          ) : (
            job.invoices.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <div className="flex justify-between text-sm py-1.5 border-b last:border-0 hover:bg-muted transition-colors rounded px-1">
                  <span>{inv.invoiceNumber}</span>
                  <span className="font-medium">${inv.total.toFixed(2)}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
