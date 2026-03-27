import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <Skeleton className="h-8 w-40 mb-1" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl shadow-sm border-l-4 border-l-muted p-3 sm:p-5">
            <Skeleton className="h-5 w-5 mb-3 rounded" />
            <Skeleton className="h-8 w-24 mb-1" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>

      {/* Today's Jobs */}
      <div className="bg-card rounded-xl shadow-sm border-l-4 border-l-green-500 p-5 mb-6">
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
        <Skeleton className="h-5 w-28 mb-1" />
        <Skeleton className="h-3 w-60 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="h-3 w-16 mb-1" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Job Status Breakdown */}
      <div className="bg-card border rounded-xl shadow-sm p-5 mb-6">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-6 w-full rounded-full mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-6 w-10 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Two-column bottom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl shadow-sm p-5">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
