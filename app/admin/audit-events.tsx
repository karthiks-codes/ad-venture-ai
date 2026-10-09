"use client";

import { useEffect, useState } from "react";

type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  teamCode?: string;
};

const REFRESH_INTERVAL_MS = 5_000;

export function AuditEvents({ initialLogs }: { initialLogs: AuditEntry[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [refreshError, setRefreshError] = useState(false);

  useEffect(() => {
    let active = true;

    async function refresh() {
      try {
        const response = await fetch("/api/admin/audit-events", { cache: "no-store" });
        if (!response.ok) throw new Error("Audit event refresh failed.");
        const result: { logs?: AuditEntry[] } = await response.json();
        if (!Array.isArray(result.logs)) throw new Error("Audit event response was invalid.");
        if (active) {
          setLogs(result.logs);
          setRefreshError(false);
        }
      } catch {
        if (active) setRefreshError(true);
      }
    }

    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <>
      <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
        {refreshError
          ? "Live updates unavailable; showing the last loaded events."
          : "Updates automatically every 5 seconds."}
      </p>
      {logs.length ? (
        <ul className="mt-4 divide-y divide-border">
          {logs.map((entry) => (
            <li className="flex flex-wrap justify-between gap-2 py-3 text-sm" key={entry.id}>
              <span>
                {entry.action}
                {entry.teamCode ? ` · ${entry.teamCode}` : ""}
                <span className="text-muted-foreground"> · {entry.actor}</span>
              </span>
              <time className="text-muted-foreground" dateTime={entry.at}>
                {entry.at}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No audit events yet.</p>
      )}
    </>
  );
}
