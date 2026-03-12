"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Kanban },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/expenses", label: "Expenses", icon: DollarSign },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "w-56 shrink-0 flex flex-col min-h-screen z-40 transition-transform duration-200",
        // Mobile: fixed off-screen, slides in when open
        "fixed inset-y-0 left-0",
        open ? "translate-x-0" : "-translate-x-full",
        // Desktop: always visible in normal flow
        "md:relative md:translate-x-0"
      )}
      style={{ background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 1px 0 rgba(255,255,255,0.04)" }}>
        <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90">
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
          className="md:hidden p-1 rounded text-white/80 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">Menu</p>
        <div className="space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "text-white shadow-[0_0_12px_rgba(233,69,96,0.3)]"
                    : "text-white/70 hover:text-white hover:bg-white/[0.08]"
                )}
                style={isActive ? { background: "linear-gradient(135deg, #e94560 0%, #d63851 100%)" } : {}}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sign Out */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
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
