"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  FileText,
  CalendarDays,
  Receipt,
  Kanban,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  X,
  Search,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeKey?:
    | "unquotedLeads"
    | "staleContacted"
    | "staleQuotes"
    | "overdueInvoices"
    | "overdueFollowUps";
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Sales",
    items: [
      {
        href: "/outreach",
        label: "Outreach",
        icon: Megaphone,
        badgeKey: "overdueFollowUps",
      },
      { href: "/pipeline", label: "Pipeline", icon: Kanban },
    ],
  },
  {
    title: "CRM",
    items: [
      {
        href: "/customers",
        label: "Customers",
        icon: Users,
        badgeKey: "unquotedLeads",
      },
      { href: "/jobs", label: "Jobs", icon: Briefcase, badgeKey: "staleContacted" },
      {
        href: "/quotes",
        label: "Quotes",
        icon: FileText,
        badgeKey: "staleQuotes",
      },
      { href: "/schedule", label: "Schedule", icon: CalendarDays },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        href: "/invoices",
        label: "Invoices",
        icon: Receipt,
        badgeKey: "overdueInvoices",
      },
      { href: "/expenses", label: "Expenses", icon: DollarSign },
      { href: "/reports", label: "Reports", icon: BarChart3 },
    ],
  },
];

interface Badges {
  unquotedLeads: number;
  staleContacted: number;
  staleQuotes: number;
  overdueInvoices: number;
  overdueFollowUps: number;
}

const BADGE_LABELS: Record<string, string> = {
  unquotedLeads: "Unquoted leads",
  staleContacted: "Contacted, needs quote",
  staleQuotes: "Stale quotes",
  overdueInvoices: "Overdue invoices",
  overdueFollowUps: "Overdue follow-ups",
};

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<Badges>({
    unquotedLeads: 0,
    staleContacted: 0,
    staleQuotes: 0,
    overdueInvoices: 0,
    overdueFollowUps: 0,
  });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch("/api/sidebar/badges");
        if (res.ok) {
          const data = await res.json();
          setBadges(data);
        }
      } catch {
        // silently fail
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className={cn(
        "w-56 shrink-0 flex flex-col min-h-screen z-40 transition-transform duration-200",
        // Mobile: fixed off-screen, slides in when open
        "fixed inset-y-0 left-0",
        open ? "translate-x-0" : "-translate-x-full",
        // Desktop: always visible in normal flow
        "md:relative md:translate-x-0",
      )}
      style={{
        background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5 flex items-center justify-between"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3 hover:opacity-90"
        >
          <Image
            src="/logo-white.png"
            alt="Mountain West Surface"
            width={120}
            height={40}
            className="object-contain"
            style={{ maxHeight: 40 }}
          />
        </Link>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden p-2 rounded text-white/80 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search trigger */}
      <div className="px-3 pt-4 pb-2">
        <button
          onClick={() => {
            document.dispatchEvent(
              new KeyboardEvent("keydown", { key: "k", metaKey: true }),
            );
          }}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-150 border border-white/10"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span>Search...</span>
          <kbd className="ml-auto text-[10px] font-medium bg-white/10 rounded px-1.5 py-0.5">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-4">
        <TooltipProvider delayDuration={200}>
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon, badgeKey }) => {
                  const isActive = pathname.startsWith(href);
                  const count = badgeKey ? badges[badgeKey] : 0;
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                        isActive
                          ? "text-white shadow-[0_0_12px_rgba(233,69,96,0.3)]"
                          : "text-white/70 hover:text-white hover:bg-white/[0.08]",
                      )}
                      style={
                        isActive
                          ? {
                              background:
                                "linear-gradient(135deg, #e94560 0%, #d63851 100%)",
                            }
                          : {}
                      }
                    >
                      <Icon className="w-[18px] h-[18px] shrink-0" />
                      {label}
                      {count > 0 && badgeKey && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-auto text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                              {count}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            {count} {BADGE_LABELS[badgeKey]}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </TooltipProvider>
      </nav>

      {/* Settings + Theme Toggle + Sign Out */}
      <div
        className="px-3 py-4 space-y-0.5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
            pathname.startsWith("/settings")
              ? "text-white shadow-[0_0_12px_rgba(233,69,96,0.3)]"
              : "text-white/70 hover:text-white hover:bg-white/[0.08]",
          )}
          style={
            pathname.startsWith("/settings")
              ? {
                  background:
                    "linear-gradient(135deg, #e94560 0%, #d63851 100%)",
                }
              : {}
          }
        >
          <Settings className="w-[18px] h-[18px] shrink-0" />
          Settings
        </Link>
        <ThemeToggle />
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-150 w-full"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
