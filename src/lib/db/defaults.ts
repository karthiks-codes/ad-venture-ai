import type { Settings } from "@/lib/submission-rules";

/** Initial event settings built from env vars (used once when no settings document exists). */
export function settingsFromEnv(env: Record<string, string | undefined>): Settings {
  const start = env["EVENT_START_AT"] || "2026-10-13T08:00:00.000Z"; // 1:30 PM IST
  const deadline = env["SUBMISSION_DEADLINE"] || "2026-10-13T10:00:00.000Z"; // 3:30 PM IST
  return {
    eventStartAt: new Date(start).toISOString(),
    submissionDeadline: new Date(deadline).toISOString(),
    timezone: env["EVENT_TIMEZONE"] || "Asia/Kolkata",
    maxVideoSizeBytes: Number(env["MAX_VIDEO_SIZE_BYTES"]) || 1.5 * 1024 ** 3,
    allowedVideoTypes: (env["ALLOWED_VIDEO_TYPES"] || "video/mp4,video/quicktime").split(",").map((s) => s.trim()).filter(Boolean),
    uploadEnabled: false,
    eventActive: true,
  };
}
