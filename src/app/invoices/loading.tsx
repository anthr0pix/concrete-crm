import { Skeleton } from "@/components/ui/skeleton";

export default function InvoicesLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <div>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-status-success-bg rounded-xl shadow-sm border-l-4 border-l-green-500 p-4">
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="bg-status-orange-bg rounded-xl shadow-sm border-l-4 border-l-orange-500 p-4">
          <Skeleton className="h-4 w-28 mb-1" />
          <Skeleton className="h-8 w-32" />
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-3 mb-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      {/* Invoice list */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between bg-card border rounded-xl shadow-sm px-5 py-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
