export type { Customer, Job, JobPhoto, Quote, QuoteLineItem, Invoice, InvoiceLineItem } from "@prisma/client";
export { JobStatus, QuoteStatus, InvoiceStatus, ServiceType } from "@prisma/client";

export const JOB_STATUS_LABELS: Record<string, string> = {
  LEAD: "Lead",
  QUOTED: "Quoted",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  CONCRETE_SEALING: "Concrete Sealing",
  PAVER_SEALING: "Paver Sealing",
  DRIVEWAY_SEALING: "Driveway Sealing",
  PATIO_SEALING: "Patio Sealing",
  POOL_DECK_SEALING: "Pool Deck Sealing",
  COMMERCIAL_SEALING: "Commercial Sealing",
  OTHER: "Other",
};

export const QUOTE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};
