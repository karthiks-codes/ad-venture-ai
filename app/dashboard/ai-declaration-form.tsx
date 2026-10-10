"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AiDeclaration, AiTool } from "@/lib/db/types";

export function AiDeclarationForm({
  tools,
  declaration,
}: {
  tools: AiTool[];
  declaration: AiDeclaration | null;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    const form = new FormData(event.currentTarget);
    if (form.getAll("toolIds").length === 0) {
      const otherTools = String(form.get("otherTools") ?? "").trim();
      if (!otherTools) {
        setError("Select a sample tool or list another AI tool you used.");
        return;
      }
    }
    setPending(true);
    try {
      const response = await fetch("/api/team/ai-declaration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toolIds: form.getAll("toolIds"),
          otherTools: String(form.get("otherTools") ?? "")
            .split(/\r?\n/)
            .map((tool) => tool.trim())
            .filter(Boolean),
          description: form.get("description"),
          rulesConfirmed: form.get("rulesConfirmed") === "on",
          originalityConfirmed: form.get("originalityConfirmed") === "on",
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(result.error || "Unable to save your declaration.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Unable to reach the declaration service. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-6 space-y-5" onSubmit={submit}>
      <fieldset>
        <legend className="text-sm font-semibold">
          Sample AI tools used (select all that apply)
        </legend>
        <p className="mt-1 text-sm text-muted-foreground">
          These examples are optional. You may use any AI tool; you are not limited to this list.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {tools.map((tool) => (
            <label
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-input bg-background p-4 text-sm transition-colors hover:border-primary/60"
              key={tool.id}
            >
              <input
                className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                defaultChecked={declaration?.toolIds.includes(tool.id) ?? false}
                name="toolIds"
                type="checkbox"
                value={tool.id}
              />
              <span>
                <span className="block font-semibold">{tool.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{tool.category}</span>
              </span>
            </label>
          ))}
        </div>
        {tools.length === 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            No sample tools are currently listed. You can still declare other tools below.
          </p>
        )}
      </fieldset>
      <label className="block text-sm font-semibold" htmlFor="otherTools">
        Other AI tools used (optional)
        <textarea
          className="mt-2 min-h-20 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={declaration?.otherTools?.join("\n") ?? ""}
          id="otherTools"
          maxLength={3000}
          name="otherTools"
          placeholder="Enter any other tools you used, one per line"
        />
      </label>
      <label className="block text-sm font-semibold" htmlFor="description">
        How did AI contribute to your advertisement?
        <textarea
          className="mt-2 min-h-32 w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          defaultValue={declaration?.description ?? ""}
          id="description"
          maxLength={2000}
          minLength={20}
          name="description"
          required
        />
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-input bg-background p-4 text-sm">
        <input
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          defaultChecked={declaration?.rulesConfirmed ?? false}
          name="rulesConfirmed"
          required
          type="checkbox"
        />
        <span>We confirm our submission follows the event rules.</span>
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-input bg-background p-4 text-sm">
        <input
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          defaultChecked={declaration?.originalityConfirmed ?? false}
          name="originalityConfirmed"
          required
          type="checkbox"
        />
        <span>We confirm the work is original or uses material with appropriate rights.</span>
      </label>
      {error && (
        <p
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg border border-success/40 bg-success/10 p-3 text-sm" role="status">
          Your AI declaration has been saved.
        </p>
      )}
      <button
        className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving…" : declaration ? "Update declaration" : "Save AI declaration"}
      </button>
    </form>
  );
}
