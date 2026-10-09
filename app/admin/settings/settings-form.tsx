"use client";

import { useState, type FormEvent } from "react";
import type { Settings } from "@/lib/submission-rules";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventStartAt: new Date(String(data.get("eventStartAt"))).toISOString(),
          submissionDeadline: new Date(String(data.get("submissionDeadline"))).toISOString(),
          timezone: data.get("timezone"),
          maxVideoSizeBytes: Number(data.get("maxVideoSizeBytes")),
          allowedVideoTypes: data.getAll("allowedVideoTypes"),
          uploadEnabled: data.get("uploadEnabled") === "on",
          eventActive: data.get("eventActive") === "on",
        }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(result.error || "Settings could not be saved.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Unable to reach the settings service.");
    } finally {
      setPending(false);
    }
  }

  const datetimeLocal = (value: string) => {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  };

  return (
    <form className="panel mt-6 space-y-5 p-6" onSubmit={submit}>
      <label className="block text-sm font-semibold">
        Event start
        <input
          className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-2"
          defaultValue={datetimeLocal(settings.eventStartAt)}
          name="eventStartAt"
          required
          type="datetime-local"
        />
      </label>
      <label className="block text-sm font-semibold">
        Submission deadline
        <input
          className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-2"
          defaultValue={datetimeLocal(settings.submissionDeadline)}
          name="submissionDeadline"
          required
          type="datetime-local"
        />
      </label>
      <label className="block text-sm font-semibold">
        Event timezone
        <input
          className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-2"
          defaultValue={settings.timezone}
          name="timezone"
          required
        />
      </label>
      <label className="block text-sm font-semibold">
        Maximum video size (bytes)
        <input
          className="mt-2 block w-full rounded-lg border border-input bg-background px-3 py-2"
          defaultValue={settings.maxVideoSizeBytes}
          min={1}
          name="maxVideoSizeBytes"
          required
          type="number"
        />
      </label>
      <fieldset>
        <legend className="text-sm font-semibold">Allowed video types</legend>
        {["video/mp4", "video/quicktime"].map((mimeType) => (
          <label className="mt-2 flex items-center gap-2 text-sm" key={mimeType}>
            <input
              defaultChecked={settings.allowedVideoTypes.includes(mimeType)}
              name="allowedVideoTypes"
              type="checkbox"
              value={mimeType}
            />
            {mimeType}
          </label>
        ))}
      </fieldset>
      <label className="flex items-center gap-2 text-sm">
        <input defaultChecked={settings.uploadEnabled} name="uploadEnabled" type="checkbox" />
        Allow final video uploads
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input defaultChecked={settings.eventActive} name="eventActive" type="checkbox" />
        Event is active (uncheck to pause event actions)
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
          Event settings saved to MongoDB.
        </p>
      )}
      <button
        className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving…" : "Save event settings"}
      </button>
    </form>
  );
}
