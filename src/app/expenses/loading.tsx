import { Skeleton } from "@/components/ui/skeleton";

export default function ExpensesLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <div>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Skeleton className="h-10 w-40 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <div className="border rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="bg-muted/50 border-b px-4 py-3 flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4 border-b last:border-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-40 flex-1" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 flex justify-end border-t pt-4">
        <div className="text-right">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-7 w-20" />
        </div>
      </div>
    </div>
  );
}
