import { OAuth2Client } from "google-auth-library";
import { NextResponse, type NextRequest } from "next/server";
import { getRepo } from "@/lib/db/index.server";
import { setSession } from "@/lib/session.server";

const cookieNames = ["adv_oauth_state", "adv_oauth_nonce", "adv_oauth_verifier"] as const;

function fail(request: NextRequest, reason: string) {
  const response = NextResponse.redirect(new URL(`/admin/login?error=${reason}`, request.url));
  for (const name of cookieNames) response.cookies.delete(name);
  return response;
}

function constantTimeEqual(left: string | undefined, right: string | undefined): boolean {
  if (!left || !right || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index++)
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.has("error")) return fail(request, "oauth-denied");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("adv_oauth_state")?.value;
  const nonce = request.cookies.get("adv_oauth_nonce")?.value;
  const verifier = request.cookies.get("adv_oauth_verifier")?.value;
  if (!constantTimeEqual(state ?? undefined, expectedState) || !code || !nonce || !verifier) {
    return fail(request, "oauth-state");
  }

  const clientId = process.env["GOOGLE_OAUTH_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_OAUTH_CLIENT_SECRET"];
  const redirectUri = process.env["GOOGLE_OAUTH_REDIRECT_URI"];
  if (!clientId || !clientSecret || !redirectUri) return fail(request, "oauth-unconfigured");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) return fail(request, "oauth-token");
    const tokenData = (await tokenResponse.json()) as { id_token?: string };
    if (!tokenData.id_token) return fail(request, "oauth-token");

    const ticket = await new OAuth2Client(clientId).verifyIdToken({
      idToken: tokenData.id_token,
      audience: clientId,
    });
    const identity = ticket.getPayload();
    if (
      !identity?.sub ||
      !identity.email ||
      identity.email_verified !== true ||
      identity.nonce !== nonce
    ) {
      return fail(request, "oauth-identity");
    }

    const email = identity.email.trim().toLowerCase();
    const repo = getRepo();
    const admin = await repo.findAdmin({ email });
    if (!admin || admin.status !== "active") return fail(request, "not-authorized");

    const updated = await repo.recordAdminLogin(email, identity.sub, identity.name ?? null);
    if (!updated) return fail(request, "not-authorized");
    await repo.log({ actor: `admin:${email}`, action: "admin.login" });
    await setSession({ role: "admin", email, googleSub: identity.sub });
    const response = NextResponse.redirect(new URL("/admin", request.url));
    for (const name of cookieNames) response.cookies.delete(name);
    return response;
  } catch (error) {
    console.error("[admin-oauth] Sign-in failed", error instanceof Error ? error.name : "unknown");
    return fail(request, "oauth-unavailable");
  }
}
