import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign } from "lucide-react";
import ExpenseTable from "@/components/expenses/ExpenseTable";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: {
      job: { select: { id: true, title: true } },
    },
  });

  // Serialize dates to ISO strings for client component
  const serialized = expenses.map((e) => ({
    ...e,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/expenses/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> New Expense
          </Button>
        </Link>
      </div>

      {expenses.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No expenses yet"
          description="Track fuel, materials, and other costs. Link them to jobs to see per-job profitability."
          action={{ label: "+ New Expense", href: "/expenses/new" }}
        />
      ) : (
        <ExpenseTable expenses={serialized} />
      )}
    </div>
  );
}
