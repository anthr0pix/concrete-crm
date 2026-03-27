import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <Skeleton className="h-8 w-28 mb-1" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="space-y-6">
        {/* Review Requests card */}
        <div className="bg-card border rounded-xl p-4 sm:p-6 space-y-5">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-10 w-[120px] rounded-md" />
            <Skeleton className="h-3 w-64" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>

        {/* Reseal Reminders card */}
        <div className="bg-card border rounded-xl p-4 sm:p-6 space-y-5">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-10 w-[120px] rounded-md" />
            <Skeleton className="h-3 w-80" />
          </div>
        </div>

        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}
