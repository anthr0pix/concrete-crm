import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Pencil, User, MapPin, Calendar, Ruler } from "lucide-react";
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS, STATUS_COLORS } from "@/types";
import { format } from "date-fns";
import PhotoUpload from "@/components/jobs/PhotoUpload";
import JobStatusSelect from "@/components/jobs/JobStatusSelect";
import DeleteJobButton from "@/components/jobs/DeleteJobButton";
import JobCostingSection from "@/components/jobs/JobCostingSection";

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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/jobs" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Jobs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{job.title}</h1>
          <p className="text-slate-500 text-sm mt-1">{SERVICE_TYPE_LABELS[job.serviceType]}</p>
        </div>
        <div className="flex items-center gap-2">
          <JobStatusSelect jobId={job.id} currentStatus={job.status} />
          <Link href={`/jobs/${job.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </Link>
          <DeleteJobButton jobId={job.id} />
        </div>
      </div>

      {/* Workflow hint */}
      {job.status === "LEAD" && job.quotes.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800 flex items-center justify-between">
          <span>Next step: Create a quote for this job so you can send the customer a price.</span>
          <Link href={`/quotes/new?jobId=${job.id}&customerId=${job.customer.id}`}>
            <Button size="sm" variant="outline" className="ml-3 shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100">New Quote</Button>
          </Link>
        </div>
      )}
      {job.status === "QUOTED" && job.invoices.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
          Waiting for the customer to accept your quote. Once accepted, you can create an invoice.
        </div>
      )}

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><User className="w-3.5 h-3.5" /> Customer</div>
          <Link href={`/customers/${job.customer.id}`} className="font-medium text-sm hover:underline">
            {job.customer.firstName} {job.customer.lastName}
          </Link>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><Calendar className="w-3.5 h-3.5" /> Scheduled</div>
          <p className="font-medium text-sm">
            {job.scheduledDate ? format(new Date(job.scheduledDate), "MMM d, yyyy") : "Not set"}
          </p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><MapPin className="w-3.5 h-3.5" /> Location</div>
          <p className="font-medium text-xs leading-tight">{jobAddress}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><Ruler className="w-3.5 h-3.5" /> Square Feet</div>
          <p className="font-medium text-sm">{job.squareFootage ? `${job.squareFootage.toLocaleString()} sq ft` : "\u2014"}</p>
        </div>
        {job.resealDueDate && (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" /> Reseal Due
            </div>
            <p className={`font-medium text-sm ${new Date(job.resealDueDate) < new Date() ? "text-red-600" : ""}`}>
              {format(new Date(job.resealDueDate), "MMM d, yyyy")}
            </p>
          </div>
        )}
        {job.reviewRequestSentAt && (
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">Review Request</div>
            <p className="font-medium text-sm text-green-600">
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
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-6 text-sm text-amber-900">
          <span className="font-medium">Notes: </span>{job.notes}
        </div>
      )}

      {/* Photos */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">Photos</h2>
        <PhotoUpload jobId={job.id} photos={job.photos} />
      </div>

      {/* Expenses */}
      {job.expenses.length > 0 && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Expenses</h2>
            <Link href={`/expenses/new?jobId=${job.id}`}>
              <Button size="sm" variant="outline">+ Add Expense</Button>
            </Link>
          </div>
          <div className="space-y-1">
            {job.expenses.map((exp) => (
              <div key={exp.id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                <div>
                  <span className="font-medium">{exp.description}</span>
                  <span className="text-slate-400 ml-2">{format(new Date(exp.date), "MMM d")}</span>
                </div>
                <span className="font-medium">${exp.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quotes & Invoices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Quotes</h2>
            <Link href={`/quotes/new?jobId=${job.id}`}>
              <Button size="sm" variant="outline">+ New Quote</Button>
            </Link>
          </div>
          {job.quotes.length === 0 ? (
            <p className="text-sm text-slate-400">No quotes yet</p>
          ) : (
            job.quotes.map((q) => (
              <Link key={q.id} href={`/quotes/${q.id}`}>
                <div className="flex justify-between text-sm py-1.5 border-b last:border-0 hover:text-slate-600">
                  <span>{q.quoteNumber}</span>
                  <span className="font-medium">${q.total.toFixed(2)}</span>
                </div>
              </Link>
            ))
          )}
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Invoices</h2>
            <Link href={`/invoices/new?jobId=${job.id}`}>
              <Button size="sm" variant="outline">+ New Invoice</Button>
            </Link>
          </div>
          {job.invoices.length === 0 ? (
            <p className="text-sm text-slate-400">No invoices yet</p>
          ) : (
            job.invoices.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <div className="flex justify-between text-sm py-1.5 border-b last:border-0 hover:text-slate-600">
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
