import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Container } from "@/components/ui/container";

const socials = [
  { href: siteConfig.links.github, label: "GitHub" },
  { href: siteConfig.links.linkedin, label: "LinkedIn" },
  { href: `mailto:${siteConfig.email}`, label: "Email" },
];

export function Footer() {
  return (
    <footer className="border-border mt-32 border-t">
      <Container
        width="wide"
        className="flex flex-col gap-6 py-10 font-mono text-xs sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-fg-subtle tracking-wide uppercase">
          © {new Date().getFullYear()} {siteConfig.name}
        </div>

        <div className="flex items-center gap-6">
          <nav aria-label="Secondary">
            <ul className="flex items-center gap-5">
              {siteConfig.footerNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-fg-muted hover:text-fg tracking-wide uppercase transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <ul className="flex items-center gap-5">
            {socials.map(({ href, label }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noreferrer"
                  className="text-fg-muted hover:text-fg tracking-wide uppercase transition-colors"
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
