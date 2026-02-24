"use client";

const SERVICE_COLORS: Record<string, string> = {
  CONCRETE_SEALING: "bg-blue-500",
  PAVER_SEALING: "bg-amber-500",
  DRIVEWAY_SEALING: "bg-emerald-500",
  PATIO_SEALING: "bg-purple-500",
  POOL_DECK_SEALING: "bg-cyan-500",
  COMMERCIAL_SEALING: "bg-orange-500",
  OTHER: "bg-gray-400",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface ServiceData {
  serviceType: string;
  label: string;
  revenue: number;
}

interface RevenueByCategoryChartProps {
  data: ServiceData[];
}

export default function RevenueByCategoryChart({ data }: RevenueByCategoryChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No revenue data available for this period.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const barWidth = (d.revenue / maxRevenue) * 100;
        const colorClass = SERVICE_COLORS[d.serviceType] || "bg-gray-400";

        return (
          <div key={d.serviceType}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-medium text-gray-700">{d.label}</span>
              <span className="text-sm text-gray-500 tabular-nums">
                {formatCurrency(d.revenue)}
              </span>
            </div>
            <div className="h-6 bg-gray-100 rounded-sm overflow-hidden">
              <div
                className={`h-full ${colorClass} rounded-sm transition-all duration-300`}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}

      {/* Total */}
      <div className="border-t pt-3 mt-3 flex justify-between items-baseline">
        <span className="text-sm font-bold text-gray-700">Total Revenue</span>
        <span className="text-sm font-bold text-gray-900 tabular-nums">
          {formatCurrency(totalRevenue)}
        </span>
      </div>
    </div>
  );
}
