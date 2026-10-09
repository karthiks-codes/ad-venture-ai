"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type ImportResult = {
  created: number;
  failed: number;
  results: { row: number; teamCode?: string; status: "created" | "failed"; message: string }[];
};

export function ImportTeamsForm({ readOnly }: { readOnly: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setPending(true);
    const file = new FormData(event.currentTarget).get("file");
    if (!(file instanceof File) || !file.size) {
      setError("Choose a CSV file to import.");
      setPending(false);
      return;
    }
    try {
      const response = await fetch("/api/admin/teams/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv; charset=utf-8" },
        body: file,
      });
      const body = (await response.json()) as ImportResult & { error?: string };
      if (!response.ok) {
        setError(body.error || "CSV import could not be completed.");
        return;
      }
      setResult(body);
      router.refresh();
    } catch {
      setError("Unable to reach the team-import service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="panel mt-4 grid gap-3 p-5" onSubmit={submit}>
      <div>
        <h2 className="text-xl font-bold">Import teams from CSV</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Required headers: teamCode, teamName, member1Name, member2Name, email. Maximum 200 teams
          and 200 KB per import. Existing codes or emails are skipped.
        </p>
      </div>
      <label className="text-sm font-semibold">
        CSV file
        <input
          accept=".csv,text/csv"
          className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
          disabled={readOnly || pending}
          name="file"
          required
          type="file"
        />
      </label>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <button
        className="rounded-xl border border-border px-4 py-2 font-semibold disabled:opacity-60 sm:justify-self-start"
        disabled={readOnly || pending}
        type="submit"
      >
        {pending ? "Importing…" : "Import CSV and email credentials"}
      </button>
      {result && (
        <div aria-live="polite" className="grid gap-1 text-sm" role="status">
          <p className="font-semibold">
            {result.created} created, {result.failed} failed.
          </p>
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            {result.results.map((item) => (
              <li key={item.row} className={item.status === "failed" ? "text-destructive" : ""}>
                Row {item.row} {item.teamCode ? `(${item.teamCode})` : ""}: {item.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}
