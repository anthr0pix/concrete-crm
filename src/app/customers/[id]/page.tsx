import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil, Phone, Mail, MapPin, Plus, Briefcase, FileText, Receipt } from "lucide-react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { JOB_STATUS_LABELS, SERVICE_TYPE_LABELS, STATUS_COLORS, QUOTE_STATUS_LABELS, INVOICE_STATUS_LABELS } from "@/types";
import { format } from "date-fns";
import DeleteCustomerButton from "@/components/customers/DeleteCustomerButton";
import ActivityFeed from "@/components/activity/ActivityFeed";
import { formatPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

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
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: "Customers", href: "/customers" }, { label: `${customer.firstName} ${customer.lastName}` }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {customer.firstName} {customer.lastName}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{formatPhone(customer.phone)}</span>
            {customer.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{customer.email}</span>}
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {customer.address}, {customer.city}, {customer.state} {customer.zip}
            </span>
          </div>
          {customer.referralSource && (
            <p className="text-sm text-muted-foreground mt-1">Referred via: {customer.referralSource}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DeleteCustomerButton
            customerId={customer.id}
            customerName={`${customer.firstName} ${customer.lastName}`}
          />
          <Link href={`/customers/${customer.id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Notes */}
      {customer.notes && (
        <div className="bg-status-amber-bg border-l-4 border-l-amber-400 rounded-r-lg px-4 py-3 mb-6 text-sm text-status-amber-text">
          <span className="font-medium">Notes: </span>{customer.notes}
        </div>
      )}

      {/* Jobs */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">Jobs</h2>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{customer.jobs.length}</span>
          </div>
          <Link href={`/jobs/new?customerId=${customer.id}`}>
            <Button size="sm" variant="outline">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Job
            </Button>
          </Link>
        </div>
        {customer.jobs.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-border">
            <Briefcase className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No jobs yet. Click &quot;New Job&quot; above to create one for this customer.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customer.jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`}>
                <div className="flex items-center justify-between bg-card rounded-xl shadow-sm px-4 py-3 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all duration-150">
                  <div>
                    <p className="font-medium text-sm">{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {SERVICE_TYPE_LABELS[job.serviceType]} ·{" "}
                      {job.scheduledDate ? format(new Date(job.scheduledDate), "MMM d, yyyy") : "Not scheduled"}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[job.status]}`}>
                    {JOB_STATUS_LABELS[job.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quotes */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">Recent Quotes</h2>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{customer.quotes.length}</span>
          </div>
          <Link href={`/quotes/new?customerId=${customer.id}`}>
            <Button size="sm" variant="outline">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Quote
            </Button>
          </Link>
        </div>
        {customer.quotes.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-border">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No quotes yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {customer.quotes.map((q) => (
                <Link key={q.id} href={`/quotes/${q.id}`}>
                  <div className="flex items-center justify-between bg-card rounded-xl shadow-sm px-4 py-3 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all duration-150">
                    <div>
                      <p className="font-medium text-sm">{q.quoteNumber}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(q.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">${q.total.toFixed(2)}</p>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[q.status]}`}>{QUOTE_STATUS_LABELS[q.status] ?? q.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {customer.quotes.length >= 5 && (
              <Link href={`/quotes?search=${encodeURIComponent(customer.firstName + " " + customer.lastName)}`} className="text-sm text-muted-foreground hover:text-foreground mt-2 inline-block">
                View all quotes &rarr;
              </Link>
            )}
          </>
        )}
      </div>

      {/* Invoices */}
      <div>
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">Recent Invoices</h2>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{customer.invoices.length}</span>
          </div>
          <Link href={`/invoices/new?customerId=${customer.id}`}>
            <Button size="sm" variant="outline">
              <Plus className="w-3.5 h-3.5 mr-1" /> New Invoice
            </Button>
          </Link>
        </div>
        {customer.invoices.length === 0 ? (
          <div className="text-center py-10 rounded-xl border border-dashed border-border">
            <Receipt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No invoices yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {customer.invoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`}>
                  <div className="flex items-center justify-between bg-card rounded-xl shadow-sm px-4 py-3 hover:shadow-md hover:-translate-y-px active:scale-[0.98] transition-all duration-150">
                    <div>
                      <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(inv.createdAt), "MMM d, yyyy")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">${inv.total.toFixed(2)}</p>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[inv.status]}`}>{INVOICE_STATUS_LABELS[inv.status] ?? inv.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {customer.invoices.length >= 5 && (
              <Link href={`/invoices?search=${encodeURIComponent(customer.firstName + " " + customer.lastName)}`} className="text-sm text-muted-foreground hover:text-foreground mt-2 inline-block">
                View all invoices &rarr;
              </Link>
            )}
          </>
        )}
      </div>

      {/* Activity Log */}
      <div className="mt-6">
        <ActivityFeed customerId={customer.id} />
      </div>
    </div>
  );
}
