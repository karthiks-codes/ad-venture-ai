import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";
import { formatBytes } from "@/lib/submission-rules";
import { AdminShell } from "../_components/admin-shell";
import { SettingsForm } from "./settings-form";

export const runtime = "nodejs";

export default async function AdminSettingsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const settings = await getRepo().getSettings();
  const values = [
    ["Event start", settings.eventStartAt],
    ["Submission deadline", settings.submissionDeadline],
    ["Timezone", settings.timezone],
    ["Upload enabled", String(settings.uploadEnabled)],
    ["Event active", String(settings.eventActive)],
    ["Maximum video size", formatBytes(settings.maxVideoSizeBytes)],
    ["Allowed MIME types", settings.allowedVideoTypes.join(", ")],
  ];
  return (
    <AdminShell admin={admin}>
      <h1 className="text-3xl font-bold">Event settings</h1>
      <p className="mt-2 text-muted-foreground">
        These settings are persisted in MongoDB and enforced by server-side upload checks.
      </p>
      <dl className="panel mt-6 divide-y divide-border">
        {values.map(([label, value]) => (
          <div className="grid gap-2 px-5 py-4 sm:grid-cols-[220px_1fr]" key={label}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-sm font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <SettingsForm settings={settings} />
    </AdminShell>
  );
}
