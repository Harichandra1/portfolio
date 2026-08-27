"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";
import { ThemeToggle } from "./theme-toggle";
import { Wordmark } from "@/components/ui/wordmark";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="border-border bg-bg/85 sticky top-0 z-50 border-b backdrop-blur-sm">
      <Container width="wide" className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={`${siteConfig.name} — home`}>
          <Wordmark />
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
                        "rounded-(--radius-md) px-2.5 py-1.5 font-mono text-xs tracking-wide uppercase transition-colors sm:px-3",
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
