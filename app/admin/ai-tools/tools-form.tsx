"use client";

import { useState, type FormEvent } from "react";
import type { AiTool } from "@/lib/db/types";

const blank: AiTool = {
  id: "",
  name: "",
  category: "",
  description: "",
  url: "https://",
  enabled: true,
  recommended: false,
  order: 0,
};

export function ToolsForm({ tools }: { tools: AiTool[] }) {
  const [selected, setSelected] = useState<AiTool>(blank);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setPending(true);
    const data = new FormData(event.currentTarget);
    const tool = {
      id: String(data.get("id")).trim(),
      name: String(data.get("name")).trim(),
      category: String(data.get("category")).trim(),
      description: String(data.get("description")).trim(),
      url: String(data.get("url")).trim(),
      enabled: data.get("enabled") === "on",
      recommended: data.get("recommended") === "on",
      order: Number(data.get("order")),
    };
    try {
      const response = await fetch("/api/admin/ai-tools", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tool),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(result.error || "Tool could not be saved.");
        return;
      }
      setSaved(true);
      window.location.reload();
    } catch {
      setError("Unable to reach the toolkit settings service.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
      <section className="panel p-5">
        <h2 className="text-xl font-bold">Current tools</h2>
        <div className="mt-4 space-y-2">
          {tools.map((tool) => (
            <button
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-3 text-left text-sm hover:border-primary"
              key={tool.id}
              onClick={() => setSelected(tool)}
              type="button"
            >
              <span>
                <strong>{tool.name}</strong>
                <span className="block text-muted-foreground">{tool.category}</span>
              </span>
              <span>{tool.enabled ? "Enabled" : "Disabled"}</span>
            </button>
          ))}
        </div>
        <button
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-semibold"
          onClick={() => setSelected(blank)}
          type="button"
        >
          Add a tool
        </button>
      </section>
      <form className="panel space-y-4 p-5" onSubmit={submit}>
        <h2 className="text-xl font-bold">{selected.id ? "Edit tool" : "Add tool"}</h2>
        <label className="block text-sm font-semibold">
          ID (lowercase kebab-case)
          <input
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
            defaultValue={selected.id}
            key={`${selected.id}-id`}
            name="id"
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Name
          <input
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
            defaultValue={selected.name}
            key={`${selected.id}-name`}
            name="name"
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Category
          <input
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
            defaultValue={selected.category}
            key={`${selected.id}-category`}
            name="category"
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Description
          <textarea
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
            defaultValue={selected.description}
            key={`${selected.id}-description`}
            name="description"
            required
          />
        </label>
        <label className="block text-sm font-semibold">
          Website URL
          <input
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
            defaultValue={selected.url}
            key={`${selected.id}-url`}
            name="url"
            required
            type="url"
          />
        </label>
        <label className="block text-sm font-semibold">
          Display order
          <input
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2"
            defaultValue={selected.order}
            key={`${selected.id}-order`}
            min={0}
            name="order"
            required
            type="number"
          />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            defaultChecked={selected.enabled}
            key={`${selected.id}-enabled`}
            name="enabled"
            type="checkbox"
          />
          Enabled
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            defaultChecked={selected.recommended}
            key={`${selected.id}-recommended`}
            name="recommended"
            type="checkbox"
          />
          Recommended
        </label>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {saved && (
          <p className="text-sm text-success" role="status">
            Saved.
          </p>
        )}
        <button
          className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving…" : "Save tool"}
        </button>
      </form>
    </div>
  );
}
