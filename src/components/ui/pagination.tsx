import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
  baseUrl: string;
  searchParams: Record<string, string | undefined>;
}

export default function Pagination({ currentPage, totalCount, pageSize, baseUrl, searchParams }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  function buildHref(page: number) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(searchParams)) {
      if (val && key !== "page") params.set(key, val);
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  }

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {totalCount}
      </p>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link href={buildHref(currentPage - 1)}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
        )}
        <span className="text-sm text-muted-foreground px-2">
          {currentPage} / {totalPages}
        </span>
        {currentPage < totalPages ? (
          <Link href={buildHref(currentPage + 1)}>
            <Button variant="outline" size="sm">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
