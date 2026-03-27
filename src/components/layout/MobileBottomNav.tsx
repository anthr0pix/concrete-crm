"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, CalendarDays, Receipt, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/invoices", label: "Invoices", icon: Receipt },
] as const;

interface MobileBottomNavProps {
  onMoreTap: () => void;
}

export default function MobileBottomNav({ onMoreTap }: MobileBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t md:hidden safe-area-pb backdrop-blur-lg bg-card/90">
      <div className="flex items-stretch">
        {tabs.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] text-xs font-medium transition-colors active:opacity-70 relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
              {isActive && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
        <button
          onClick={onMoreTap}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[52px] text-xs font-medium text-muted-foreground transition-colors active:opacity-70"
        >
          <Menu className="w-5 h-5" />
          More
        </button>
      </div>
    </nav>
  );
}
