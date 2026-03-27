"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";
import MobileBottomNav from "./MobileBottomNav";
import CommandPalette from "@/components/CommandPalette";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isFullscreenPage = pathname === "/login" || pathname.startsWith("/portal/");
  if (isFullscreenPage) return <>{children}</>;

  return (
    <TooltipProvider>
      <div className="flex min-h-screen bg-background">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b sticky top-0 z-20 shadow-sm" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-white/80" />
            </button>
            <Image
              src="/logo-white.png"
              alt="Mountain West Surface"
              width={100}
              height={32}
              className="object-contain"
              style={{ maxHeight: 28 }}
            />
          </div>

          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            {children}
          </main>
        </div>

        <MobileBottomNav onMoreTap={() => setSidebarOpen(true)} />
        <CommandPalette />
      </div>
    </TooltipProvider>
  );
}
