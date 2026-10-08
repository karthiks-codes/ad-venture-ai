// Pure, testable submission-state rules. The server is authoritative.
export type SubmissionStatus = "none" | "uploading" | "submitted" | "reopened";

export type Settings = {
  eventStartAt: string;
  submissionDeadline: string;
  timezone: string;
  maxVideoSizeBytes: number;
  allowedVideoTypes: string[];
  uploadEnabled: boolean;
  eventActive: boolean;
};

export type UploadCheck = { ok: true } | { ok: false; reason: string };

export function canStartUpload(args: {
  settings: Settings;
  now: Date;
  status: SubmissionStatus;
  hasProblem: boolean;
  hasDeclaration: boolean;
  file: { size: number; type: string; name: string };
}): UploadCheck {
  const { settings, now, status, file } = args;
  if (!settings.eventActive) return { ok: false, reason: "The event is currently paused." };
  if (!settings.uploadEnabled) return { ok: false, reason: "Uploads are not open yet." };
  if (now.getTime() > new Date(settings.submissionDeadline).getTime())
    return { ok: false, reason: "The submission deadline has passed." };
  if (status === "submitted") return { ok: false, reason: "Your team has already submitted its final video." };
  if (!args.hasProblem) return { ok: false, reason: "Draw your problem statement first." };
  if (!args.hasDeclaration) return { ok: false, reason: "Complete the AI declaration first." };
  if (!settings.allowedVideoTypes.includes(file.type))
    return { ok: false, reason: `File type not allowed. Use: ${settings.allowedVideoTypes.join(", ")}` };
  if (file.size <= 0 || file.size > settings.maxVideoSizeBytes)
    return { ok: false, reason: `File must be under ${formatBytes(settings.maxVideoSizeBytes)}.` };
  return { ok: true };
}

export function formatBytes(n: number): string {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= 1024 ** 2) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.round(n / 1024)} KB`;
}
