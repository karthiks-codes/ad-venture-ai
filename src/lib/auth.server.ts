import "server-only";
import { getRepo } from "@/lib/db/index.server";
import { readSession } from "@/lib/session.server";

export async function getCurrentTeam(options: { allowPasswordChange?: boolean } = {}) {
  const session = await readSession();
  if (!session || session.role !== "team") return null;

  const team = await getRepo().getTeam(session.teamId);
  if (!team || team.status !== "active" || (team.authVersion ?? 0) !== session.authVersion)
    return null;
  if (team.temporaryDemoExpiresAt && Date.parse(team.temporaryDemoExpiresAt) <= Date.now())
    return null;
  if (team.mustChangePassword && !options.allowPasswordChange)
    return { team, mustChangePassword: true };
  return { team, mustChangePassword: false };
}

export async function getCurrentAdmin() {
  const session = await readSession();
  if (!session || session.role !== "admin") return null;

  const admin = await getRepo().findAdmin({ email: session.email });
  if (!admin || admin.status !== "active" || admin.googleSub !== session.googleSub) return null;
  return admin;
}
