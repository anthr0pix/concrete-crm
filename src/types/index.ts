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
  LEAD: "bg-purple-100 text-purple-700",
  QUOTED: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  // Quote statuses
  DRAFT: "bg-amber-100 text-amber-700",
  SENT: "bg-blue-100 text-blue-700",
  ACCEPTED: "bg-green-100 text-green-700",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-orange-100 text-orange-700",
  // Invoice statuses
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOID: "bg-slate-200 text-slate-600",
};
