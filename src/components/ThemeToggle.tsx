"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const modes = ["light", "dark", "system"] as const;
const icons = { light: Sun, dark: Moon, system: Monitor } as const;
const labels = { light: "Light", dark: "Dark", system: "System" } as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const current = (theme as (typeof modes)[number]) || "system";
  const next = modes[(modes.indexOf(current) + 1) % modes.length];
  const Icon = icons[current];

  return (
    <button
      onClick={() => setTheme(next)}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-150 w-full"
      title={`Theme: ${labels[current]} — click for ${labels[next]}`}
    >
      <Icon className="w-[18px] h-[18px]" />
      {labels[current]}
    </button>
  );
}
