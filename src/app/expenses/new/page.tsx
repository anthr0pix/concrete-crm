import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ExpenseForm from "@/components/expenses/ExpenseForm";

export const dynamic = "force-dynamic";

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { jobId } = await searchParams;

  const jobs = await prisma.job.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <Link
        href={jobId ? `/jobs/${jobId}` : "/expenses"}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> {jobId ? "Back to Job" : "Back to Expenses"}
      </Link>
      <h1 className="text-2xl font-bold mb-6">Add Expense</h1>
      <ExpenseForm jobs={jobs} defaultValues={jobId ? { jobId } : undefined} />
    </div>
  );
}
