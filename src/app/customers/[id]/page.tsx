import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Pencil, Phone, Mail, MapPin, Plus } from "lucide-react";
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS } from "@/types";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-700",
  QUOTED: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      jobs: { orderBy: { createdAt: "desc" } },
      quotes: { orderBy: { createdAt: "desc" }, take: 5 },
      invoices: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!customer) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/customers" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back to Customers
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {customer.firstName} {customer.lastName}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{customer.phone}</span>
            {customer.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{customer.email}</span>}
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {customer.address}, {customer.city}, {customer.state} {customer.zip}
            </span>
          </div>
          {customer.referralSource && (
            <p className="text-sm text-slate-400 mt-1">Referred via: {customer.referralSource}</p>
          )}
        </div>
        <Link href={`/customers/${customer.id}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>
        </Link>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3 mb-6 text-sm text-amber-900">
          <span className="font-medium">Notes: </span>{customer.notes}
        </div>
      )}

      {/* Jobs */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Jobs ({customer.jobs.length})</h2>
          <Link href={`/jobs/new?customerId=${customer.id}`}>
            <Button size="sm" variant="outline">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Job
            </Button>
          </Link>
        </div>
        {customer.jobs.length === 0 ? (
          <p className="text-sm text-slate-400">No jobs yet.</p>
        ) : (
          <div className="space-y-2">
            {customer.jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
                  <div>
                    <p className="font-medium text-sm">{job.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {SERVICE_TYPE_LABELS[job.serviceType]} ·{" "}
                      {job.scheduledDate ? format(new Date(job.scheduledDate), "MMM d, yyyy") : "Not scheduled"}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[job.status]}`}>
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quotes */}
      {customer.quotes.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-3">Recent Quotes</h2>
          <div className="space-y-2">
            {customer.quotes.map((q) => (
              <Link key={q.id} href={`/quotes/${q.id}`}>
                <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
                  <div>
                    <p className="font-medium text-sm">{q.quoteNumber}</p>
                    <p className="text-xs text-slate-400">{format(new Date(q.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${q.total.toFixed(2)}</p>
                    <Badge variant="secondary" className="text-xs">{q.status}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Invoices */}
      {customer.invoices.length > 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-3">Recent Invoices</h2>
          <div className="space-y-2">
            {customer.invoices.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3 hover:shadow-sm transition-shadow">
                  <div>
                    <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-slate-400">{format(new Date(inv.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${inv.total.toFixed(2)}</p>
                    <Badge variant="secondary" className="text-xs">{inv.status}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
