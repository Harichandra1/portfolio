import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";

// Text rather than icons: lucide dropped brand marks in v1, and spelled-out
// labels are clearer for screen readers anyway.
const socials = [
  { href: siteConfig.links.github, label: "GitHub" },
  { href: siteConfig.links.linkedin, label: "LinkedIn" },
  { href: siteConfig.links.x, label: "X" },
  { href: `mailto:${siteConfig.email}`, label: "Email" },
];

export function Footer() {
  return (
    <footer className="border-border mt-24 border-t py-10">
      <Container
        width="wide"
        className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-fg-subtle text-sm">
          © {new Date().getFullYear()} {siteConfig.name}
        </div>

        <div className="flex items-center gap-5">
          <nav aria-label="Secondary">
            <ul className="flex items-center gap-4">
              {siteConfig.footerNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-fg-muted hover:text-fg text-sm transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="flex items-center gap-4">
            {socials.map(({ href, label }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="text-fg-subtle hover:text-fg text-sm transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
