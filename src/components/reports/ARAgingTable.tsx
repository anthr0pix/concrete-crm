function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const BUCKET_STYLES: Record<string, string> = {
  "0-30": "text-emerald-700 bg-emerald-50",
  "31-60": "text-yellow-700 bg-yellow-50",
  "61-90": "text-orange-700 bg-orange-50",
  "90+": "text-red-700 bg-red-50",
};

const BUCKET_LABELS: Record<string, string> = {
  "0-30": "0 - 30 days",
  "31-60": "31 - 60 days",
  "61-90": "61 - 90 days",
  "90+": "90+ days",
};

interface ARAgingTableProps {
  buckets: Record<string, { count: number; total: number }>;
  totalOutstanding: number;
}

export default function ARAgingTable({ buckets, totalOutstanding }: ARAgingTableProps) {
  const bucketOrder = ["0-30", "31-60", "61-90", "90+"];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 font-semibold text-muted-foreground">Period</th>
            <th className="text-right py-2 font-semibold text-muted-foreground"># Invoices</th>
            <th className="text-right py-2 font-semibold text-muted-foreground">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bucketOrder.map((key) => {
            const bucket = buckets[key] || { count: 0, total: 0 };
            const style = BUCKET_STYLES[key] || "";

            return (
              <tr key={key} className="border-b border-border">
                <td className="py-2.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${style}`}>
                    {BUCKET_LABELS[key]}
                  </span>
                </td>
                <td className="text-right py-2.5 tabular-nums text-muted-foreground">
                  {bucket.count}
                </td>
                <td className="text-right py-2.5 tabular-nums text-foreground">
                  {formatCurrency(bucket.total)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2">
            <td className="py-2.5 font-bold text-foreground">Total Outstanding</td>
            <td className="text-right py-2.5 font-bold tabular-nums text-foreground">
              {bucketOrder.reduce((sum, key) => sum + (buckets[key]?.count || 0), 0)}
            </td>
            <td className="text-right py-2.5 font-bold tabular-nums text-foreground">
              {formatCurrency(totalOutstanding)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
