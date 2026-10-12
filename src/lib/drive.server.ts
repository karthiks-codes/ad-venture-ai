import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

/*
 * Google Drive storage service — isolated provider module.
 * Uses an organizer-authorized OAuth refresh token with access to the event folder.
 * The server ONLY creates folders and resumable upload sessions; the browser
 * PUTs the video bytes directly to the returned session URL. No video bytes
 * ever pass through this app server.
 */
const SCOPE = "https://www.googleapis.com/auth/drive";

function sessionEncryptionKey(): Buffer {
  const secret = process.env["AUTH_SECRET"];
  if (!secret || secret.length < 32)
    throw new Error("AUTH_SECRET must be configured before storing Drive upload sessions.");
  return createHash("sha256").update(secret).digest();
}

export function encryptUploadSession(url: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sessionEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(url, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function decryptUploadSession(encrypted: string): string {
  const [iv, tag, ciphertext] = encrypted.split(".");
  if (!iv || !tag || !ciphertext) throw new Error("Stored Drive upload session is invalid.");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    sessionEncryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function driveConfigured(): boolean {
  return Boolean(
    process.env["GOOGLE_DRIVE_OAUTH_CLIENT_ID"] &&
    process.env["GOOGLE_DRIVE_OAUTH_CLIENT_SECRET"] &&
    process.env["GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN"] &&
    process.env["GOOGLE_DRIVE_ROOT_FOLDER_ID"],
  );
}

let cachedOAuth: { configKey: string; client: OAuth2Client } | null = null;

async function accessToken(): Promise<string> {
  const clientId = process.env["GOOGLE_DRIVE_OAUTH_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_DRIVE_OAUTH_CLIENT_SECRET"];
  const refreshToken = process.env["GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN"];
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google Drive OAuth is not configured. Set GOOGLE_DRIVE_OAUTH_CLIENT_ID, GOOGLE_DRIVE_OAUTH_CLIENT_SECRET, and GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN.",
    );
  }

  const configKey = createHash("sha256")
    .update(`${clientId}\0${clientSecret}\0${refreshToken}`)
    .digest("hex");
  if (!cachedOAuth || cachedOAuth.configKey !== configKey) {
    const client = new OAuth2Client(clientId, clientSecret);
    client.setCredentials({ refresh_token: refreshToken });
    cachedOAuth = { configKey, client };
  }
  const credentials = await cachedOAuth.client.getAccessToken();
  if (!credentials.token) throw new Error("Google did not issue a Drive API access token.");
  return credentials.token;
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Drive API request failed [${res.status}].`);
  return res;
}

const q = encodeURIComponent;

async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const query = `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const params = new URLSearchParams({
    q: query,
    fields: "files(id)",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const sharedDriveId = process.env["GOOGLE_DRIVE_SHARED_DRIVE_ID"];
  if (sharedDriveId) {
    params.set("corpora", "drive");
    params.set("driveId", sharedDriveId);
  }
  const list = (await (await api(`/drive/v3/files?${params.toString()}`)).json()) as {
    files: { id: string }[];
  };
  if (list.files[0]) return list.files[0].id;
  const created = (await (
    await api(`/drive/v3/files?supportsAllDrives=true&fields=id`, {
      method: "POST",
      body: JSON.stringify({
        name,
        mimeType: "application/vnd.google-apps.folder",
        parents: [parentId],
      }),
    })
  ).json()) as { id: string };
  return created.id;
}

/** Ensures Submissions/<TEAMCODE - Team Name>/ exists under the root folder. */
export async function ensureTeamFolder(teamCode: string, teamName: string): Promise<string> {
  const root = process.env["GOOGLE_DRIVE_ROOT_FOLDER_ID"]!;
  const subs = await findOrCreateFolder("Submissions", root);
  return findOrCreateFolder(`${teamCode} - ${teamName}`.slice(0, 120), subs);
}

export async function saveTeamReportPdf(
  folderId: string,
  fileName: string,
  contents: Uint8Array,
): Promise<{ id: string; name: string }> {
  const escapedName = fileName.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const params = new URLSearchParams({
    q: `name='${escapedName}' and '${folderId}' in parents and mimeType='application/pdf' and trashed=false`,
    fields: "files(id,name)",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
  });
  const sharedDriveId = process.env["GOOGLE_DRIVE_SHARED_DRIVE_ID"];
  if (sharedDriveId) {
    params.set("corpora", "drive");
    params.set("driveId", sharedDriveId);
  }
  const existing = (await (await api(`/drive/v3/files?${params.toString()}`)).json()) as {
    files: { id: string; name: string }[];
  };
  const file = existing.files[0];
  if (file) {
    await api(`/upload/drive/v3/files/${q(file.id)}?uploadType=media&supportsAllDrives=true`, {
      method: "PATCH",
      headers: { "Content-Type": "application/pdf" },
      body: Buffer.from(contents),
    });
    return file;
  }

  const boundary = `adv-report-${randomBytes(12).toString("hex")}`;
  const metadata = JSON.stringify({
    name: fileName,
    mimeType: "application/pdf",
    parents: [folderId],
  });
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`,
    ),
    Buffer.from(contents),
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const created = (await (
    await api("/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name", {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    })
  ).json()) as { id: string; name: string };
  if (!created.id || !created.name)
    throw new Error("Drive did not confirm the team report upload.");
  return created;
}

/** Creates a resumable upload session. `origin` makes the session URL CORS-usable from the browser. */
export async function createResumableSession(args: {
  folderId: string;
  fileName: string;
  mimeType: string;
  size: number;
  origin: string;
}): Promise<string> {
  const res = await api(`/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true`, {
    method: "POST",
    headers: {
      "X-Upload-Content-Type": args.mimeType,
      "X-Upload-Content-Length": String(args.size),
      Origin: args.origin,
    },
    body: JSON.stringify({
      name: args.fileName,
      parents: [args.folderId],
      mimeType: args.mimeType,
    }),
  });
  const url = res.headers.get("Location");
  if (!url) throw new Error("Drive did not return an upload session URL");
  return url;
}

export async function checkResumableSession(
  url: string,
  size: number,
): Promise<{ state: "in-progress" | "complete" | "expired"; fileId?: string }> {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes */${size}`,
      "Content-Length": "0",
    },
    body: "",
    cache: "no-store",
    redirect: "manual",
  });
  if (response.status === 308) return { state: "in-progress" };
  if (response.status === 200 || response.status === 201) {
    const file = (await response.json()) as { id?: string };
    if (!file.id) throw new Error("Drive completed upload response had no file identifier.");
    return { state: "complete", fileId: file.id };
  }
  if (response.status === 404 || response.status === 410) return { state: "expired" };
  throw new Error(`Drive upload-session check failed [${response.status}].`);
}

/** Verifies the uploaded file server-side (metadata only — never downloads bytes). */
export async function getFileMeta(fileId: string) {
  return (await (
    await api(
      `/drive/v3/files/${q(fileId)}?supportsAllDrives=true&fields=id,name,size,mimeType,webViewLink,parents,videoMediaMetadata`,
    )
  ).json()) as {
    id: string;
    name: string;
    size: string;
    mimeType: string;
    webViewLink?: string;
    parents?: string[];
    videoMediaMetadata?: { durationMillis?: string; width?: number; height?: number };
  };
}
