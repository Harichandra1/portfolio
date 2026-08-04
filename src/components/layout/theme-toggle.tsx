"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsHydrated } from "@/hooks/use-is-hydrated";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The server can't know the resolved theme, so hold a stable placeholder
  // until hydration rather than guessing and mismatching.
  const hydrated = useIsHydrated();

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={
        hydrated ? `Switch to ${isDark ? "light" : "dark"} theme` : "Toggle theme"
      }
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {hydrated ? isDark ? <Sun /> : <Moon /> : <span className="size-4" />}
    </Button>
  );
}
