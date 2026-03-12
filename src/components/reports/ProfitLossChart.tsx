"use client";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface MonthData {
  month: number;
  revenue: number;
  expenses: number;
  profit: number;
}

interface ProfitLossChartProps {
  data: MonthData[];
}

export default function ProfitLossChart({ data }: ProfitLossChartProps) {
  const maxValue = Math.max(
    ...data.map((d) => Math.max(d.revenue, d.expenses)),
    1
  );

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex gap-6 text-sm mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <span className="text-muted-foreground">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-red-400" />
          <span className="text-muted-foreground">Expenses</span>
        </div>
      </div>

      {data.map((d) => {
        const revenueWidth = maxValue > 0 ? (d.revenue / maxValue) * 100 : 0;
        const expensesWidth = maxValue > 0 ? (d.expenses / maxValue) * 100 : 0;

        return (
          <div key={d.month} className="flex items-center gap-3">
            {/* Month label */}
            <div className="w-10 text-sm font-medium text-muted-foreground text-right shrink-0">
              {MONTH_NAMES[d.month]}
            </div>

            {/* Bars */}
            <div className="flex-1 min-w-0 space-y-1">
              {/* Revenue bar */}
              <div className="flex items-center gap-2">
                <div className="h-5 relative flex-1">
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500 rounded-sm transition-all duration-300"
                    style={{ width: `${revenueWidth}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
                  {formatCurrency(d.revenue)}
                </span>
              </div>

              {/* Expenses bar */}
              <div className="flex items-center gap-2">
                <div className="h-5 relative flex-1">
                  <div
                    className="absolute inset-y-0 left-0 bg-red-400 rounded-sm transition-all duration-300"
                    style={{ width: `${expensesWidth}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right shrink-0">
                  {formatCurrency(d.expenses)}
                </span>
              </div>
            </div>

            {/* Profit */}
            <div
              className={`w-20 text-right text-sm font-semibold shrink-0 ${
                d.profit >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {d.profit >= 0 ? "+" : ""}
              {formatCurrency(d.profit)}
            </div>
          </div>
        );
      })}

      {/* Totals row */}
      <div className="border-t pt-3 mt-3 flex items-center gap-3">
        <div className="w-10 text-sm font-bold text-foreground text-right shrink-0">
          Total
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Revenue: {formatCurrency(data.reduce((s, d) => s + d.revenue, 0))}
            </span>
            <span className="text-muted-foreground">
              Expenses: {formatCurrency(data.reduce((s, d) => s + d.expenses, 0))}
            </span>
          </div>
        </div>
        <div
          className={`w-20 text-right text-sm font-bold shrink-0 ${
            data.reduce((s, d) => s + d.profit, 0) >= 0
              ? "text-emerald-600"
              : "text-red-600"
          }`}
        >
          {data.reduce((s, d) => s + d.profit, 0) >= 0 ? "+" : ""}
          {formatCurrency(data.reduce((s, d) => s + d.profit, 0))}
        </div>
      </div>
    </div>
  );
}
