/*
 * Google Drive storage service — isolated provider module.
 * Uses a service account (JWT bearer) with access to a Shared Drive.
 * The server ONLY creates folders and resumable upload sessions; the browser
 * PUTs the video bytes directly to the returned session URL. No video bytes
 * ever pass through this app server.
 */
const SCOPE = "https://www.googleapis.com/auth/drive";

export function driveConfigured(): boolean {
  return Boolean(process.env["GOOGLE_DRIVE_CLIENT_EMAIL"] && process.env["GOOGLE_DRIVE_PRIVATE_KEY"] && process.env["GOOGLE_DRIVE_ROOT_FOLDER_ID"]);
}

const b64url = (s: string | ArrayBuffer) => {
  const str = typeof s === "string" ? s : String.fromCharCode(...new Uint8Array(s));
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

let cached: { token: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;
  const email = process.env["GOOGLE_DRIVE_CLIENT_EMAIL"]!;
  const pem = process.env["GOOGLE_DRIVE_PRIVATE_KEY"]!.replace(/\\n/g, "\n");
  const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "")), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const iat = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(JSON.stringify({ iss: email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat, exp: iat + 3600 }))}`;
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(sig)}` }),
  });
  if (!res.ok) throw new Error(`Drive auth failed [${res.status}]`);
  const j = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  return j.access_token;
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Drive API ${path} failed [${res.status}]: ${await res.text()}`);
  return res;
}

const q = encodeURIComponent;

async function findOrCreateFolder(name: string, parentId: string): Promise<string> {
  const query = `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const list = (await (await api(`/drive/v3/files?q=${q(query)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`)).json()) as { files: { id: string }[] };
  if (list.files[0]) return list.files[0].id;
  const created = (await (await api(`/drive/v3/files?supportsAllDrives=true&fields=id`, {
    method: "POST", body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  })).json()) as { id: string };
  return created.id;
}

/** Ensures Submissions/<TEAMCODE - Team Name>/ exists under the root folder. */
export async function ensureTeamFolder(teamCode: string, teamName: string): Promise<string> {
  const root = process.env["GOOGLE_DRIVE_ROOT_FOLDER_ID"]!;
  const subs = await findOrCreateFolder("Submissions", root);
  return findOrCreateFolder(`${teamCode} - ${teamName}`.slice(0, 120), subs);
}

/** Creates a resumable upload session. `origin` makes the session URL CORS-usable from the browser. */
export async function createResumableSession(args: { folderId: string; fileName: string; mimeType: string; size: number; origin: string }): Promise<string> {
  const res = await api(`/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true`, {
    method: "POST",
    headers: { "X-Upload-Content-Type": args.mimeType, "X-Upload-Content-Length": String(args.size), Origin: args.origin },
    body: JSON.stringify({ name: args.fileName, parents: [args.folderId], mimeType: args.mimeType }),
  });
  const url = res.headers.get("Location");
  if (!url) throw new Error("Drive did not return an upload session URL");
  return url;
}

/** Verifies the uploaded file server-side (metadata only — never downloads bytes). */
export async function getFileMeta(fileId: string) {
  return (await (await api(`/drive/v3/files/${q(fileId)}?supportsAllDrives=true&fields=id,name,size,mimeType,webViewLink,parents`)).json()) as {
    id: string; name: string; size: string; mimeType: string; webViewLink?: string; parents?: string[];
  };
}
