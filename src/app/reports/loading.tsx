import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <Skeleton className="h-8 w-28 mb-1" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Year selector */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-16 rounded-md" />
        ))}
      </div>

      {/* P&L Chart area */}
      <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full rounded" />
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border rounded-xl shadow-sm p-5">
          <Skeleton className="h-6 w-44 mb-4" />
          <Skeleton className="h-48 w-full rounded" />
        </div>
        <div className="bg-card border rounded-xl shadow-sm p-5">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="bg-card border rounded-xl shadow-sm p-5">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
