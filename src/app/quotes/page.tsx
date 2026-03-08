import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { QUOTE_STATUS_LABELS, STATUS_COLORS } from "@/types";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { firstName: true, lastName: true } },
      lineItems: true,
    },
  });

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Quotes</h1>
          <p className="text-slate-500 text-sm mt-1">{quotes.length} total</p>
        </div>
        <Link href="/quotes/new">
          <Button><Plus className="w-4 h-4 mr-2" /> New Quote</Button>
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">No quotes yet</p>
          <p className="text-sm mt-1">Create a quote to send a price estimate to a customer.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {quotes.map((q) => (
            <Link key={q.id} href={`/quotes/${q.id}`}>
              <div className="flex items-center justify-between bg-white border rounded-lg px-5 py-4 hover:shadow-sm transition-shadow cursor-pointer">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{q.quoteNumber}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[q.status]}`}>
                      {QUOTE_STATUS_LABELS[q.status]}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {q.customer.firstName} {q.customer.lastName} · {format(new Date(q.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">${q.total.toFixed(2)}</p>
                  {q.validUntil && (
                    <p className="text-xs text-slate-400">Valid until {format(new Date(q.validUntil), "MMM d")}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
