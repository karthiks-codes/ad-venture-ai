"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";

const CHUNK_BYTES = 8 * 1024 * 1024;
const MAX_RETRIES = 3;

type UploadState = "idle" | "starting" | "uploading" | "finalizing" | "complete";
type ProbeResult = { offset: number; fileId?: string };

function uploadChunk(
  url: string,
  file: File,
  start: number,
  end: number,
  onProgress: (loaded: number) => void,
) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${file.size}`);
    xhr.timeout = 120_000;
    xhr.upload.onprogress = (event) => onProgress(event.loaded);
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText });
    xhr.onerror = () => reject(new Error("Network error while uploading a video chunk."));
    xhr.ontimeout = () => reject(new Error("A video chunk took too long to upload."));
    xhr.send(file.slice(start, end));
  });
}

function queryUploadStatus(url: string, file: File): Promise<ProbeResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);
    xhr.setRequestHeader("Content-Range", `bytes */${file.size}`);
    xhr.timeout = 30_000;
    xhr.onload = () => {
      if (xhr.status === 308) {
        const range = xhr.getResponseHeader("Range");
        const last = range?.match(/bytes=0-(\d+)/)?.[1];
        resolve({ offset: last ? Number(last) + 1 : 0 });
        return;
      }
      if (xhr.status === 200 || xhr.status === 201) {
        const result = JSON.parse(xhr.responseText) as { id?: string };
        if (result.id) resolve({ offset: file.size, fileId: result.id });
        else reject(new Error("Google Drive returned no completed file ID."));
        return;
      }
      reject(new Error(`Google Drive could not resume the upload [${xhr.status}].`));
    };
    xhr.onerror = () =>
      reject(new Error("Could not reach the existing Google Drive upload session."));
    xhr.ontimeout = () => reject(new Error("The Google Drive upload session did not respond."));
    xhr.send(new Blob());
  });
}

async function readFileId(body: string): Promise<string | null> {
  if (!body) return null;
  try {
    const value: unknown = JSON.parse(body);
    return typeof value === "object" &&
      value !== null &&
      "id" in value &&
      typeof value.id === "string"
      ? value.id
      : null;
  } catch {
    return null;
  }
}

export function VideoUploader({
  allowedTypes,
  maxBytes,
  existingStatus,
}: {
  allowedTypes: string[];
  maxBytes: number;
  existingStatus: string;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [confirmationEmailSent, setConfirmationEmailSent] = useState<boolean | null>(null);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    setFile(event.target.files?.[0] ?? null);
    setError("");
    setProgress(0);
  }

  async function startUpload() {
    if (!file) return;
    if (file.size > maxBytes) {
      setError(
        `The selected file exceeds the ${Math.round((maxBytes / 1024 ** 3) * 10) / 10} GB limit.`,
      );
      return;
    }
    if (!allowedTypes.includes(file.type)) {
      setError(`Choose a supported video type: ${allowedTypes.join(", ")}.`);
      return;
    }

    setState("starting");
    setError("");
    setConfirmationEmailSent(null);
    try {
      const startResponse = await fetch("/api/team/submission/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: file.size, mimeType: file.type }),
      });
      const startResult = (await startResponse.json()) as {
        uploadUrl?: string;
        resumed?: boolean;
        completedFileId?: string;
        error?: string;
      };
      if (!startResponse.ok || !startResult.uploadUrl)
        throw new Error(startResult.error || "Could not start the Drive upload.");

      let offset = 0;
      let fileId: string | undefined = startResult.completedFileId;
      if (startResult.resumed && !fileId) {
        const status = await queryUploadStatus(startResult.uploadUrl, file);
        offset = status.offset;
        fileId = status.fileId;
      }
      setState("uploading");

      while (!fileId && offset < file.size) {
        const end = Math.min(file.size, offset + CHUNK_BYTES);
        let completed = false;
        let lastError: Error | null = null;
        for (let attempt = 0; attempt < MAX_RETRIES && !completed; attempt++) {
          try {
            const result = await uploadChunk(startResult.uploadUrl, file, offset, end, (loaded) => {
              setProgress(Math.min(100, Math.floor(((offset + loaded) / file.size) * 100)));
            });
            if (result.status === 308) {
              offset = end;
              setProgress(Math.min(100, Math.floor((offset / file.size) * 100)));
              completed = true;
            } else if (result.status === 200 || result.status === 201) {
              fileId = (await readFileId(result.body)) ?? undefined;
              if (!fileId) throw new Error("Google Drive did not return the completed file ID.");
              offset = file.size;
              setProgress(100);
              completed = true;
            } else {
              throw new Error(`Google Drive rejected a video chunk [${result.status}].`);
            }
          } catch (cause) {
            lastError = cause instanceof Error ? cause : new Error("Video chunk upload failed.");
            if (attempt < MAX_RETRIES - 1) {
              await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
              const status = await queryUploadStatus(startResult.uploadUrl, file);
              offset = status.offset;
              fileId = status.fileId;
              if (fileId || offset >= end) completed = true;
            }
          }
        }
        if (!completed && !fileId)
          throw lastError ?? new Error("Could not resume the video upload.");
      }

      if (!fileId) {
        const status = await queryUploadStatus(startResult.uploadUrl, file);
        fileId = status.fileId;
      }
      if (!fileId)
        throw new Error("Upload is still incomplete. Keep this page open and try resume again.");

      setState("finalizing");
      const finalizeResponse = await fetch("/api/team/submission/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      const finalizeResult = (await finalizeResponse.json()) as {
        ok?: boolean;
        emailSent?: boolean;
        error?: string;
      };
      if (!finalizeResponse.ok || !finalizeResult.ok)
        throw new Error(finalizeResult.error || "Drive upload needs server verification.");
      setConfirmationEmailSent(finalizeResult.emailSent ?? false);
      setState("complete");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The upload could not be completed.");
      setState("idle");
    }
  }

  if (existingStatus === "submitted" || state === "complete") {
    return (
      <p
        className="mt-4 rounded-xl border border-success/40 bg-success/10 p-5 text-sm"
        role="status"
      >
        Final video submitted.{" "}
        {confirmationEmailSent === false
          ? "The upload is confirmed, but the email confirmation could not be sent."
          : ""}
      </p>
    );
  }

  return (
    <div className="mt-6">
      <label className="block text-sm font-semibold" htmlFor="video-file">
        Choose your final video
        <input
          accept={allowedTypes.join(",")}
          className="mt-2 block w-full rounded-xl border border-input bg-background px-4 py-3 text-sm"
          disabled={state !== "idle"}
          id="video-file"
          onChange={chooseFile}
          type="file"
        />
      </label>
      <p className="mt-2 text-xs text-muted-foreground">
        Allowed formats: {allowedTypes.join(", ")} · Maximum{" "}
        {Math.round((maxBytes / 1024 ** 3) * 10) / 10} GB. Video bytes are sent directly to
        organizer Google Drive, not through this application.
      </p>
      {file && (
        <p className="mt-3 text-sm text-muted-foreground">
          {file.name} · {(file.size / 1024 ** 3).toFixed(2)} GB
        </p>
      )}
      {state !== "idle" && (
        <div className="mt-4">
          <div
            aria-label={`Upload progress ${progress}%`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={progress}
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="progressbar"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {state === "starting"
              ? "Starting secure Drive session…"
              : state === "finalizing"
                ? "Verifying the completed file…"
                : `Uploading directly to Drive… ${progress}%`}
          </p>
        </div>
      )}
      {existingStatus === "uploading" && (
        <p className="mt-3 text-sm text-warning">
          An upload is in progress. Choose the same file to resume it; do not choose a different
          final video.
        </p>
      )}
      {error && (
        <p
          className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      )}
      <button
        className="mt-5 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground disabled:cursor-wait disabled:opacity-60"
        disabled={!file || state !== "idle"}
        onClick={startUpload}
        type="button"
      >
        {existingStatus === "uploading" ? "Resume video upload" : "Upload final video"}
      </button>
    </div>
  );
}
