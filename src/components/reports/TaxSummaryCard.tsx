"use client";

import { useState } from "react";
import { EXPENSE_CATEGORY_LABELS } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const QUARTER_LABELS = ["Q1 (Jan - Mar)", "Q2 (Apr - Jun)", "Q3 (Jul - Sep)", "Q4 (Oct - Dec)"];

interface QuarterData {
  quarter: number;
  revenue: number;
  totalExpenses: number;
  netIncome: number;
  expenses: Record<string, number>;
}

interface TaxSummaryCardProps {
  quarters: QuarterData[];
}

function QuarterCard({ data }: { data: QuarterData }) {
  const [expanded, setExpanded] = useState(false);
  const hasExpenses = Object.keys(data.expenses).length > 0;

  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-3">
          {QUARTER_LABELS[data.quarter - 1]}
        </h3>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Revenue</div>
            <div className="font-semibold text-status-success-text tabular-nums">
              {formatCurrency(data.revenue)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Expenses</div>
            <div className="font-semibold text-status-danger-text tabular-nums">
              {formatCurrency(data.totalExpenses)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Net Income</div>
            <div
              className={`font-semibold tabular-nums ${
                data.netIncome >= 0 ? "text-status-success-text" : "text-status-danger-text"
              }`}
            >
              {formatCurrency(data.netIncome)}
            </div>
          </div>
        </div>

        {hasExpenses && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {expanded ? "Hide" : "Show"} expense breakdown
          </button>
        )}
      </div>

      {expanded && hasExpenses && (
        <div className="border-t bg-muted p-4">
          <div className="space-y-1.5">
            {Object.entries(data.expenses)
              .sort(([, a], [, b]) => b - a)
              .map(([category, amount]) => (
                <div key={category} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {EXPENSE_CATEGORY_LABELS[category] || category}
                  </span>
                  <span className="tabular-nums text-foreground">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaxSummaryCard({ quarters }: TaxSummaryCardProps) {
  const annualRevenue = quarters.reduce((sum, q) => sum + q.revenue, 0);
  const annualExpenses = quarters.reduce((sum, q) => sum + q.totalExpenses, 0);
  const annualNet = annualRevenue - annualExpenses;

  return (
    <div className="space-y-4">
      {/* Annual summary */}
      <div className="bg-muted border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Annual Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground mb-1">Total Revenue</div>
            <div className="text-lg font-bold text-status-success-text tabular-nums">
              {formatCurrency(annualRevenue)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Total Expenses</div>
            <div className="text-lg font-bold text-status-danger-text tabular-nums">
              {formatCurrency(annualExpenses)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground mb-1">Net Income</div>
            <div
              className={`text-lg font-bold tabular-nums ${
                annualNet >= 0 ? "text-status-success-text" : "text-status-danger-text"
              }`}
            >
              {formatCurrency(annualNet)}
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quarters.map((q) => (
          <QuarterCard key={q.quarter} data={q} />
        ))}
      </div>
    </div>
  );
}
