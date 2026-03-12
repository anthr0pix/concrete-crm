"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { EXPENSE_CATEGORY_LABELS } from "@/types";

const CATEGORY_COLORS: Record<string, string> = {
  MATERIALS: "bg-blue-100 text-blue-700",
  FUEL: "bg-orange-100 text-orange-700",
  EQUIPMENT: "bg-purple-100 text-purple-700",
  LABOR: "bg-green-100 text-green-700",
  INSURANCE: "bg-yellow-100 text-yellow-700",
  MARKETING: "bg-pink-100 text-pink-700",
  OFFICE: "bg-slate-100 text-slate-700",
  OTHER: "bg-gray-100 text-gray-700",
};

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  vendor: string | null;
  receiptUrl: string | null;
  jobId: string | null;
  notes: string | null;
  job?: { id: string; title: string } | null;
}

interface Props {
  expenses: Expense[];
}

export default function ExpenseTable({ expenses }: Props) {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date.slice(0, 10) > endDate) return false;
      return true;
    });
  }, [expenses, categoryFilter, startDate, endDate]);

  const total = useMemo(() => {
    return filtered.reduce((sum, e) => sum + e.amount, 0);
  }, [filtered]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Categories</option>
          {Object.entries(EXPENSE_CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No expenses found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={CATEGORY_COLORS[expense.category]}
                      >
                        {EXPENSE_CATEGORY_LABELS[expense.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {expense.vendor || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {expense.job ? (
                        <Link
                          href={`/jobs/${expense.job.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {expense.job.title}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/expenses/${expense.id}/edit`}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((expense) => (
              <div
                key={expense.id}
                className="bg-card border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Badge
                    variant="secondary"
                    className={CATEGORY_COLORS[expense.category]}
                  >
                    {EXPENSE_CATEGORY_LABELS[expense.category]}
                  </Badge>
                  <span className="font-semibold">
                    ${expense.amount.toFixed(2)}
                  </span>
                </div>
                <p className="font-medium text-foreground">
                  {expense.description}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {format(new Date(expense.date), "MMM d, yyyy")}
                  </span>
                  {expense.vendor && <span>{expense.vendor}</span>}
                </div>
                {expense.job && (
                  <Link
                    href={`/jobs/${expense.job.id}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {expense.job.title}
                  </Link>
                )}
                <div className="flex justify-end">
                  <Link
                    href={`/expenses/${expense.id}/edit`}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex justify-end border-t pt-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">
                Total ({filtered.length} expense{filtered.length !== 1 ? "s" : ""})
              </p>
              <p className="text-xl font-bold text-foreground">
                ${total.toFixed(2)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
