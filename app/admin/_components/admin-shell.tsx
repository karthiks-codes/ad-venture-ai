import Link from "next/link";
import type { ReactNode } from "react";
import type { Admin } from "@/lib/db/types";

const nav = [
  ["/admin", "Overview"],
  ["/admin/teams", "Teams"],
  ["/admin/problems", "Problems"],
  ["/admin/submissions", "Submissions"],
  ["/admin/ai-tools", "AI toolkit"],
  ["/admin/settings", "Settings"],
] as const;

export function AdminShell({ admin, children }: { admin: Admin; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-hero">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link className="font-display font-extrabold" href="/admin">
            ADventure <span className="text-primary">Ops</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-muted-foreground sm:block">
              {admin.name || admin.email} · {admin.role}
            </span>
            <form action="/api/auth/admin/logout" method="post">
              <button className="font-semibold text-primary" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav aria-label="Admin sections" className="mb-8 flex flex-wrap gap-2">
          {nav.map(([href, label]) => (
            <Link
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </main>
  );
}
