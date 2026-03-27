import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <Skeleton className="h-8 w-32 mb-1" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Show/Hide Closed toggle */}
      <Skeleton className="h-5 w-32 mb-4" />

      {/* Kanban columns — horizontal scroll, fixed-width columns matching PipelineColumn */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="flex flex-col min-w-[280px] w-[280px] rounded-xl border border-border border-t-4 border-t-muted-foreground/30 bg-card">
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            {/* Cards */}
            <div className="p-2 space-y-2">
              {Array.from({ length: col < 2 ? 3 : 2 }).map((_, row) => (
                <div key={row} className="bg-card border rounded-xl p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
