import { Skeleton } from "@/components/ui/skeleton";

export default function ScheduleLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <div>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-4 w-64 hidden md:block" />
        </div>
        <Skeleton className="h-10 w-28 rounded-md" />
      </div>

      {/* Desktop: nav bar + calendar grid */}
      <div className="hidden md:block">
        {/* Navigation: prev/title/next on left, view toggle on right */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-16 rounded-md" />
            <Skeleton className="h-9 w-14 rounded-md" />
          </div>
        </div>

        {/* Calendar + sidebar */}
        <div className="flex gap-4">
          <div className="flex-1 min-w-0 bg-card border rounded-xl overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="px-2 py-3 border-r last:border-0">
                  <Skeleton className="h-4 w-10 mx-auto" />
                </div>
              ))}
            </div>
            {/* Calendar rows */}
            {Array.from({ length: 5 }).map((_, row) => (
              <div key={row} className="grid grid-cols-7 border-b last:border-0">
                {Array.from({ length: 7 }).map((_, col) => (
                  <div key={col} className="min-h-24 px-2 py-2 border-r last:border-0">
                    <Skeleton className="h-4 w-6 mb-2" />
                    {row < 3 && col % 3 === 0 && (
                      <Skeleton className="h-5 w-full rounded" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
          {/* Unscheduled sidebar placeholder */}
          <div className="w-64 shrink-0">
            <Skeleton className="h-6 w-32 mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border rounded-xl p-3">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: day agenda */}
      <div className="md:hidden">
        {/* Mobile nav: prev/date/next + today */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>

        {/* Day agenda cards */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
