import Link from "next/link";
import { ChevronRight, ArrowLeft } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  // Find the last item with an href (the parent page)
  const parentItem = [...items].reverse().find((item) => item.href);

  return (
    <nav className="mb-6">
      {/* Mobile: compact back link */}
      {parentItem && (
        <Link
          href={parentItem.href!}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors md:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          {parentItem.label}
        </Link>
      )}

      {/* Desktop: full breadcrumb trail */}
      <div className="hidden md:inline-flex items-center gap-1 text-sm text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground/50" />}
              {isLast || !item.href ? (
                <span className={isLast ? "font-semibold text-foreground" : ""}>{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.label}
                </Link>
              )}
            </span>
          );
        })}
      </div>
    </nav>
  );
}
