import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/rules", label: "Rules" },
  { href: "/problems", label: "Challenges" },
  { href: "/ai-tools", label: "Need help?" },
];

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-white/10 bg-background/80 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4"
      >
        <Link className="font-display text-sm font-extrabold tracking-tight sm:text-base" href="/">
          <span className="text-gradient">AD</span>venture <span className="text-primary">’26</span>
        </Link>
        <div className="flex items-center gap-3 text-sm sm:gap-6">
          {links.map((link) => (
            <Link
              className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline"
              key={link.href}
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          <Link
            className="rounded-full bg-primary px-4 py-2 font-bold text-primary-foreground transition-opacity hover:opacity-90"
            href="/login"
          >
            Team login
          </Link>
        </div>
      </nav>
    </header>
  );
}
