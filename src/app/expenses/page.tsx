import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ExpenseTable from "@/components/expenses/ExpenseTable";

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
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-slate-500 text-sm mt-1">
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
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg font-medium">No expenses yet</p>
          <p className="text-sm mt-1">Track fuel, materials, and other costs. Link them to jobs to see per-job profitability.</p>
        </div>
      ) : (
        <ExpenseTable expenses={serialized} />
      )}
    </div>
  );
}
