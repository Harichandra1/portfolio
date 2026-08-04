"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-border bg-bg/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <Container width="wide" className="flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="text-fg font-mono text-sm font-semibold tracking-tight"
          aria-label={`${siteConfig.name} — home`}
        >
          {siteConfig.shortName}
          <span className="text-accent">.</span>
        </Link>

        <div className="flex items-center gap-1">
          <nav aria-label="Main">
            <ul className="flex items-center gap-1">
              {siteConfig.nav.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-sm transition-colors sm:px-3",
                        active ? "text-fg" : "text-fg-muted hover:text-fg",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
