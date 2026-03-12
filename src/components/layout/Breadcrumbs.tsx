import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="inline-flex items-center gap-1 text-sm text-slate-500 mb-6 bg-slate-100/60 px-3 py-1.5 rounded-lg">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
            {isLast || !item.href ? (
              <span className={isLast ? "font-semibold text-slate-900" : ""}>{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-slate-900 transition-colors">
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
