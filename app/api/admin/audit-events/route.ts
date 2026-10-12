import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth.server";
import { getRepo } from "@/lib/db/index.server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Administrator sign-in required." }, { status: 401 });
    }
    const showAll = new URL(request.url).searchParams.get("all") === "true";
    const logs = await getRepo().listLogs(showAll ? 0 : 8);
    return NextResponse.json(
      {
        logs: logs.map(({ id, at, actor, action, teamCode, meta }) => ({
          id,
          at,
          actor,
          action,
          teamCode,
          meta,
        })),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("[admin-logs] Refresh failed", error instanceof Error ? error.name : "unknown");
    return NextResponse.json({ error: "Audit events could not be refreshed." }, { status: 503 });
  }
}
