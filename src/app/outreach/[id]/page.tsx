import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { format, isPast } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Building2,
  User,
  DollarSign,
  Calendar,
  MapPin,
  Clock,
  Briefcase,
  Plus,
  FileText,
  Receipt,
} from "lucide-react";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { OUTREACH_STATUS_LABELS, STATUS_COLORS, SERVICE_TYPE_LABELS, JOB_STATUS_LABELS } from "@/types";
import OutreachQuickActions from "@/components/outreach/OutreachQuickActions";
import OutreachFollowUpWrapper from "@/components/outreach/OutreachFollowUpWrapper";
import OutreachTimeline from "@/components/outreach/OutreachTimeline";
import OutreachProfileClient from "@/components/outreach/OutreachProfileClient";

export const dynamic = "force-dynamic";

export default async function OutreachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const manager = await prisma.propertyManager.findUnique({
    where: { id },
    include: {
      _count: { select: { outreachNotes: true } },
      jobs: {
        orderBy: { createdAt: "desc" },
        include: {
          customer: { select: { firstName: true, lastName: true } },
          _count: { select: { quotes: true, invoices: true } },
        },
      },
    },
  });

  if (!manager) notFound();

  const fullAddress = [manager.address, manager.city, manager.state]
    .filter(Boolean)
    .join(", ") + (manager.zip ? ` ${manager.zip}` : "");

  const INFO_CARD_BORDERS: Record<string, string> = {
    Contact: "border-t-blue-400",
    Properties: "border-t-green-400",
    Value: "border-t-orange-400",
    FollowUp: "border-t-red-400",
    LastContact: "border-t-purple-400",
    Added: "border-t-slate-400",
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Pipeline", href: "/outreach" },
          { label: manager.companyName },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {manager.companyName}
            </h1>
            <span
              className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${STATUS_COLORS[manager.status] || ""}`}
            >
              {OUTREACH_STATUS_LABELS[manager.status] || manager.status}
            </span>
          </div>
          {fullAddress.trim() && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {fullAddress}
            </p>
          )}
        </div>
        <OutreachProfileClient
          managerId={id}
          initialStatus={manager.status}
        />
      </div>

      {/* Quick Actions */}
      <OutreachQuickActions
        phone={manager.phone}
        email={manager.email}
        website={manager.website}
        address={manager.address}
        city={manager.city}
        state={manager.state}
        zip={manager.zip}
      />

      {/* Info Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div
          className={`bg-card rounded-xl shadow-sm border-t-2 ${INFO_CARD_BORDERS["Contact"]} p-4`}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <User className="w-3.5 h-3.5" /> Contact
          </div>
          <p className="font-medium text-sm">{manager.contactName}</p>
        </div>
        <div
          className={`bg-card rounded-xl shadow-sm border-t-2 ${INFO_CARD_BORDERS["Properties"]} p-4`}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <Building2 className="w-3.5 h-3.5" /> Properties
          </div>
          <p className="font-medium text-sm">
            {manager.propertyCount != null ? manager.propertyCount : "\u2014"}
          </p>
        </div>
        <div
          className={`bg-card rounded-xl shadow-sm border-t-2 ${INFO_CARD_BORDERS["Value"]} p-4`}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            <DollarSign className="w-3.5 h-3.5" /> Est. Value
          </div>
          <p className="font-medium text-sm">
            {manager.estimatedValue != null
              ? `$${manager.estimatedValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/yr`
              : "\u2014"}
          </p>
        </div>
        <div
          className={`bg-card rounded-xl shadow-sm border-t-2 ${INFO_CARD_BORDERS[manager.nextFollowUpAt ? "FollowUp" : "Added"]} p-4`}
        >
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
            {manager.nextFollowUpAt ? (
              <>
                <Calendar className="w-3.5 h-3.5" /> Follow-up
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5" /> Added
              </>
            )}
          </div>
          {manager.nextFollowUpAt ? (
            <p
              className={`font-medium text-sm ${isPast(new Date(manager.nextFollowUpAt)) ? "text-status-danger-text" : ""}`}
            >
              {format(new Date(manager.nextFollowUpAt), "MMM d, yyyy")}
              {isPast(new Date(manager.nextFollowUpAt)) && " (Overdue)"}
            </p>
          ) : (
            <p className="font-medium text-sm">
              {format(new Date(manager.createdAt), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </div>

      {/* Follow-up Banner */}
      <OutreachFollowUpWrapper
        managerId={id}
        nextFollowUpAt={manager.nextFollowUpAt?.toISOString() ?? null}
        lastContactedAt={manager.lastContactedAt?.toISOString() ?? null}
      />

      {/* Two-column: Details + Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-semibold text-sm border-b pb-2">Details</h2>
          {manager.lastContactedAt && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Last Contacted
              </p>
              <p className="text-sm">
                {format(new Date(manager.lastContactedAt), "MMM d, yyyy")}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
              Added
            </p>
            <p className="text-sm">
              {format(new Date(manager.createdAt), "MMM d, yyyy")}
            </p>
          </div>
          {manager.phone && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Phone
              </p>
              <p className="text-sm">{manager.phone}</p>
            </div>
          )}
          {manager.email && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Email
              </p>
              <p className="text-sm">{manager.email}</p>
            </div>
          )}
          {manager.website && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Website
              </p>
              <a
                href={
                  manager.website.match(/^https?:\/\//)
                    ? manager.website
                    : `https://${manager.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {manager.website}
              </a>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-sm border-b pb-2 mb-3">Notes</h2>
          {manager.notes ? (
            <p className="text-sm whitespace-pre-wrap">{manager.notes}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No notes</p>
          )}
        </div>
      </div>

      {/* Jobs Section */}
      <div className="bg-card border rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base">Jobs</h2>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{manager.jobs.length}</span>
          </div>
          <Link href={`/jobs/new?propertyManagerId=${id}`}>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" /> Create Job
            </Button>
          </Link>
        </div>
        {manager.jobs.length === 0 ? (
          <div className="text-center py-6">
            <Briefcase className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No jobs linked yet</p>
            <Link href={`/jobs/new?propertyManagerId=${id}`}>
              <Button size="sm" variant="outline" className="mt-2">
                <Plus className="w-4 h-4 mr-1" /> Create Job
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {manager.jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="block">
                <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{job.title}</p>
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${STATUS_COLORS[job.status] || ""}`}>
                        {JOB_STATUS_LABELS[job.status] || job.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{SERVICE_TYPE_LABELS[job.serviceType]}</span>
                      {job.scheduledDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(job.scheduledDate), "MMM d, yyyy")}
                        </span>
                      )}
                      <span>{job.customer.firstName} {job.customer.lastName}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    {job._count.quotes > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        <FileText className="w-3 h-3" /> {job._count.quotes}
                      </span>
                    )}
                    {job._count.invoices > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        <Receipt className="w-3 h-3" /> {job._count.invoices}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Interaction Timeline */}
      <OutreachTimeline managerId={id} />
    </div>
  );
}
