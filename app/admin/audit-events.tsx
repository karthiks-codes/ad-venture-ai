"use client";

import { useEffect, useState } from "react";

type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  teamCode?: string;
  meta?: Record<string, unknown>;
};

const REFRESH_INTERVAL_MS = 60_000;

function LocalDateTime({ value }: { value: string }) {
  const [formatted, setFormatted] = useState("Loading local time…");

  useEffect(() => {
    const date = new Date(value);
    setFormatted(
      Number.isNaN(date.getTime())
        ? "Invalid timestamp"
        : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
            date,
          ),
    );
  }, [value]);

  return (
    <time className="text-muted-foreground" dateTime={value}>
      {formatted}
    </time>
  );
}

export function AuditEvents({ initialLogs }: { initialLogs: AuditEntry[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshError, setRefreshError] = useState(false);

  useEffect(() => {
    let active = true;

    async function refresh() {
      setLoading(showAll);
      try {
        const url = showAll ? "/api/admin/audit-events?all=true" : "/api/admin/audit-events";
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("Audit event refresh failed.");
        const result: { logs?: AuditEntry[] } = await response.json();
        if (!Array.isArray(result.logs)) throw new Error("Audit event response was invalid.");
        if (active) {
          setLogs(result.logs);
          setRefreshError(false);
        }
      } catch {
        if (active) setRefreshError(true);
      } finally {
        if (active) setLoading(false);
      }
    }

    void refresh();
    const interval = window.setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [showAll]);

  return (
    <>
      <p className="mt-1 text-xs text-muted-foreground" aria-live="polite">
        {refreshError
          ? showAll
            ? "Unable to load all events; showing the last loaded events."
            : "Live updates unavailable; showing the last loaded events."
          : "Updates automatically every 60 seconds. Times are shown in your local timezone."}
      </p>
      <button
        className="mt-3 border border-border px-4 py-2 text-sm font-semibold"
        disabled={loading}
        onClick={() => setShowAll((value) => !value)}
        type="button"
      >
        {loading ? "Loading events…" : showAll ? "Show recent events" : "Show all log events"}
      </button>
      {logs.length ? (
        <ul className="mt-4 divide-y divide-border">
          {logs.map((entry) => (
            <li className="py-3 text-sm" key={entry.id}>
              <div className="flex flex-wrap justify-between gap-2">
                <span>
                  <strong>{entry.action}</strong>
                  {entry.teamCode ? ` · ${entry.teamCode}` : ""}
                  <span className="text-muted-foreground"> · {entry.actor}</span>
                </span>
                <LocalDateTime value={entry.at} />
              </div>
              {entry.meta && Object.keys(entry.meta).length > 0 && (
                <details className="mt-2 text-xs text-muted-foreground">
                  <summary className="w-fit cursor-pointer font-semibold">Event details</summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/50 p-3">
                    {JSON.stringify(entry.meta, null, 2)}
                  </pre>
                </details>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No audit events yet.</p>
      )}
    </>
  );
}
