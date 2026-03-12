export type { Customer, Job, JobPhoto, Quote, QuoteLineItem, Invoice, InvoiceLineItem, PaymentEvent, AppSettings, Expense } from "@prisma/client";
export { JobStatus, QuoteStatus, InvoiceStatus, ServiceType, DepositType, ExpenseCategory } from "@prisma/client";

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

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  MATERIALS: "Materials",
  FUEL: "Fuel",
  EQUIPMENT: "Equipment",
  LABOR: "Labor",
  INSURANCE: "Insurance",
  MARKETING: "Marketing",
  OFFICE: "Office",
  OTHER: "Other",
};

export const STATUS_COLORS: Record<string, string> = {
  // Job statuses
  LEAD: "bg-status-purple-bg text-status-purple-text",
  QUOTED: "bg-status-info-bg text-status-info-text",
  SCHEDULED: "bg-status-warning-bg text-status-warning-text",
  IN_PROGRESS: "bg-status-orange-bg text-status-orange-text",
  COMPLETED: "bg-status-success-bg text-status-success-text",
  CANCELLED: "bg-status-danger-bg text-status-danger-text",
  // Quote statuses
  DRAFT: "bg-status-amber-bg text-status-amber-text",
  SENT: "bg-status-info-bg text-status-info-text",
  ACCEPTED: "bg-status-success-bg text-status-success-text",
  DECLINED: "bg-status-danger-bg text-status-danger-text",
  EXPIRED: "bg-status-orange-bg text-status-orange-text",
  // Invoice statuses
  PAID: "bg-status-success-bg text-status-success-text",
  OVERDUE: "bg-status-danger-bg text-status-danger-text",
  VOID: "bg-status-neutral-bg text-status-neutral-text",
};
