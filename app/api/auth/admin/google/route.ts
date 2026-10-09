import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { randomToken } from "@/lib/session.server";

const COOKIE_SECONDS = 5 * 60;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: COOKIE_SECONDS,
  };
}

export async function GET(request: NextRequest) {
  const clientId = process.env["GOOGLE_OAUTH_CLIENT_ID"];
  const redirectUri = process.env["GOOGLE_OAUTH_REDIRECT_URI"];
  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL("/admin/login?error=oauth-unconfigured", request.url));
  }

  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken(48);
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("nonce", nonce);
  authorizationUrl.searchParams.set("code_challenge", challenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set("adv_oauth_state", state, cookieOptions());
  response.cookies.set("adv_oauth_nonce", nonce, cookieOptions());
  response.cookies.set("adv_oauth_verifier", verifier, cookieOptions());
  return response;
}
