import { Skeleton } from "@/components/ui/skeleton";

export default function InvoiceDetailLoading() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-44 mb-4" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-36 mt-1" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-md" />
        </div>
      </div>

      {/* Line items table */}
      <div className="hidden sm:block bg-card border rounded-lg overflow-hidden mb-4">
        <div className="bg-muted/50 border-b px-4 py-3 flex justify-between">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-12">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-14" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="px-4 py-3 flex justify-between border-b last:border-0">
            <Skeleton className="h-4 w-48" />
            <div className="flex gap-12">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="max-w-xs ml-auto space-y-2 mb-6">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between border-t pt-2">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
}
