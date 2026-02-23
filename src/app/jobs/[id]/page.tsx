import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Pencil, User, MapPin, Calendar, Ruler } from "lucide-react";
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/types";
import { format } from "date-fns";
import PhotoUpload from "@/components/jobs/PhotoUpload";
import JobStatusSelect from "@/components/jobs/JobStatusSelect";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-700",
  QUOTED: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

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
        </div>
      </div>

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
          <p className="font-medium text-sm text-xs leading-tight">{jobAddress}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1"><Ruler className="w-3.5 h-3.5" /> Sq Ft</div>
          <p className="font-medium text-sm">{job.squareFootage ? `${job.squareFootage.toLocaleString()} sq ft` : "—"}</p>
        </div>
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

      {/* Quotes & Invoices */}
      <div className="grid grid-cols-2 gap-4">
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
