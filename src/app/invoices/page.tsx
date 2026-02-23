import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { INVOICE_STATUS_LABELS } from "@/types";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOID: "bg-slate-200 text-slate-500",
};

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: { select: { firstName: true, lastName: true } } },
  });

  const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.total, 0);
  const totalOutstanding = invoices.filter((i) => ["SENT", "OVERDUE"].includes(i.status)).reduce((s, i) => s + i.total, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">{invoices.length} total</p>
        </div>
        <Link href="/invoices/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Invoice</Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">Total Collected</p>
          <p className="text-2xl font-bold text-green-800">${totalPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
          <p className="text-sm text-orange-700 font-medium">Outstanding</p>
          <p className="text-2xl font-bold text-orange-800">${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">No invoices yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <Link key={inv.id} href={`/invoices/${inv.id}`}>
              <div className="flex items-center justify-between bg-white border rounded-lg px-5 py-4 hover:shadow-sm transition-shadow cursor-pointer">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{inv.invoiceNumber}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status]}`}>
                      {INVOICE_STATUS_LABELS[inv.status]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {inv.customer.firstName} {inv.customer.lastName} · {format(new Date(inv.createdAt), "MMM d, yyyy")}
                    {inv.dueDate && ` · Due ${format(new Date(inv.dueDate), "MMM d")}`}
                  </p>
                </div>
                <p className="font-bold text-lg">${inv.total.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
