// In-memory DEMO repository — used ONLY when DEMO_MODE=true. Nothing here is persisted.
import bcrypt from "bcryptjs";
import type { AiDeclaration, AiTool, Admin, AuditLog, Repo, ResetToken, Submission, Team } from "./types";
import { DuplicateError } from "./types";
import type { Settings } from "@/lib/submission-rules";
import { DEMO_PASSWORD, DEMO_TEAMS, DEMO_TOOLS } from "./seed-data";
import { getProblem } from "@/config/problems";
import { settingsFromEnv } from "./defaults";

const now = () => new Date().toISOString();

export function createMemoryRepo(opts: { seed?: boolean } = { seed: true }): Repo {
  const teams = new Map<string, Team>();
  const admins = new Map<string, Admin>();
  const submissions = new Map<string, Submission>();
  const declarations = new Map<string, AiDeclaration>();
  const tools = new Map<string, AiTool>();
  const logs: AuditLog[] = [];
  const tokens = new Map<string, ResetToken>();
  const hits = new Map<string, number[]>();
  let settings: Settings = { ...settingsFromEnv(process.env), uploadEnabled: true };

  if (opts.seed) {
    const hash = bcrypt.hashSync(DEMO_PASSWORD, 8);
    DEMO_TOOLS.forEach((t) => tools.set(t.id, { ...t }));
    const today = Date.now();
    settings = { ...settings, eventStartAt: new Date(today - 3600_000).toISOString(), submissionDeadline: new Date(today + 6 * 3600_000).toISOString() };
    DEMO_TEAMS.forEach((d, i) => {
      const id = `team_${i + 1}`;
      const ts = now();
      teams.set(id, {
        id, ...d, passwordHash: hash, status: "active", isDemo: true,
        firstLoginAt: d.mustChangePassword ? null : ts, lastLoginAt: null,
        problemId: d.problemId, assignedAt: d.problemId ? ts : null, assignedBy: d.problemId ? "draw" : null,
        submissionStatus: d.submissionStatus, toolkitViewedAt: null, challengeViewedAt: d.problemId ? ts : null,
        createdAt: ts, updatedAt: ts,
      });
      if (d.submissionStatus === "submitted") {
        submissions.set(id, {
          teamId: id, status: "submitted", driveFolderId: "demo-folder", driveFileId: "demo-file", driveFileName: "final-video.mp4",
          driveFileSize: 734_003_200, driveWebViewLink: null, mimeType: "video/mp4", uploadStartedAt: ts, uploadCompletedAt: ts, attempts: 1,
        });
        declarations.set(id, { teamId: id, toolIds: ["chatgpt", "runway", "elevenlabs"], description: "Demo declaration.", rulesConfirmed: true, originalityConfirmed: true, createdAt: ts });
      }
    });
  }

  const counts = () => {
    const c: Record<string, number> = {};
    teams.forEach((t) => { if (t.problemId) c[t.problemId] = (c[t.problemId] ?? 0) + 1; });
    return c;
  };

  return {
    kind: "memory",
    async health() { return { kind: "memory", status: "demo", message: "Demo mode — data is NOT persisted" }; },
    async listTeams() { return [...teams.values()].sort((a, b) => a.teamCode.localeCompare(b.teamCode)); },
    async getTeam(id) { return teams.get(id) ?? null; },
    async findTeamByLogin(identifier) {
      const q = identifier.trim().toLowerCase();
      return [...teams.values()].find((t) => t.teamCode.toLowerCase() === q || t.email.toLowerCase() === q) ?? null;
    },
    async createTeam(t) {
      const code = t.teamCode.trim().toUpperCase(), email = t.email.trim().toLowerCase();
      if ([...teams.values()].some((x) => x.teamCode === code || x.email === email)) throw new DuplicateError("Team code or email already exists");
      const ts = now();
      const team: Team = {
        id: crypto.randomUUID(), teamCode: code, teamName: t.teamName, member1Name: t.member1Name, member2Name: t.member2Name, email,
        passwordHash: t.passwordHash, mustChangePassword: t.mustChangePassword ?? true, status: t.status ?? "active", isDemo: t.isDemo ?? false,
        firstLoginAt: null, lastLoginAt: null, problemId: null, assignedAt: null, assignedBy: null, submissionStatus: "none",
        toolkitViewedAt: null, challengeViewedAt: null, createdAt: ts, updatedAt: ts,
      };
      teams.set(team.id, team); return team;
    },
    async updateTeam(id, patch) {
      const t = teams.get(id); if (!t) return null;
      const n = { ...t, ...patch, id, updatedAt: now() }; teams.set(id, n); return n;
    },
    async assignProblemAtomic(teamId, choose, by, force) {
      const t = teams.get(teamId); if (!t) return null;
      if (t.problemId && !force) return null;
      const c = counts(); if (t.problemId) c[t.problemId] = (c[t.problemId] ?? 1) - 1;
      const pid = choose(c); if (!pid || !getProblem(pid)) return null;
      const n = { ...t, problemId: pid, assignedAt: now(), assignedBy: by, updatedAt: now() };
      teams.set(teamId, n); return n;
    },
    async assignmentCounts() { return counts(); },
    async getSubmission(teamId) { return submissions.get(teamId) ?? null; },
    async listSubmissions() { return [...submissions.values()]; },
    async beginSubmission(teamId, patch) {
      const s = submissions.get(teamId);
      if (s?.status === "submitted") return null;
      const n: Submission = {
        teamId, driveFolderId: null, driveFileId: null, driveFileName: null, driveFileSize: null, driveWebViewLink: null, mimeType: null,
        uploadCompletedAt: null, ...patch, status: "uploading", uploadStartedAt: now(), attempts: (s?.attempts ?? 0) + 1,
      };
      submissions.set(teamId, n); return n;
    },
    async updateSubmission(teamId, patch) {
      const s = submissions.get(teamId); if (!s) return null;
      const n = { ...s, ...patch }; submissions.set(teamId, n); return n;
    },
    async listTools(all) { return [...tools.values()].filter((t) => all || t.enabled).sort((a, b) => a.order - b.order); },
    async upsertTool(tool) { tools.set(tool.id, tool); return tool; },
    async getDeclaration(teamId) { return declarations.get(teamId) ?? null; },
    async saveDeclaration(d) { declarations.set(d.teamId, d); },
    async getSettings() { return settings; },
    async updateSettings(patch) { settings = { ...settings, ...patch }; return settings; },
    async findAdmin(q) {
      return [...admins.values()].find((a) => (q.email && a.email === q.email.toLowerCase()) || (q.googleSub && a.googleSub === q.googleSub)) ?? null;
    },
    async listAdmins() { return [...admins.values()]; },
    async upsertAdmin(a) {
      const email = a.email.toLowerCase(); const ex = admins.get(email); const ts = now();
      const n: Admin = { id: ex?.id ?? crypto.randomUUID(), email, googleSub: ex?.googleSub ?? a.googleSub ?? null, name: a.name ?? ex?.name ?? null,
        role: a.role, status: a.status, lastLoginAt: ex?.lastLoginAt ?? null, createdAt: ex?.createdAt ?? ts, updatedAt: ts };
      admins.set(email, n); return n;
    },
    async recordAdminLogin(email, googleSub, name) {
      const a = admins.get(email.toLowerCase());
      if (!a || a.status !== "active" || (a.googleSub && a.googleSub !== googleSub)) return null;
      const n = { ...a, googleSub, name, lastLoginAt: now(), updatedAt: now() }; admins.set(a.email, n); return n;
    },
    async log(e) { logs.unshift({ ...e, id: crypto.randomUUID(), at: now() }); if (logs.length > 500) logs.pop(); },
    async listLogs(limit) { return logs.slice(0, limit); },
    async saveResetToken(t) { tokens.set(t.tokenHash, { ...t }); },
    async consumeResetToken(h) {
      const t = tokens.get(h);
      if (!t || t.usedAt || new Date(t.expiresAt) < new Date()) return null;
      t.usedAt = now(); return { ...t };
    },
    async hitRateLimit(key, max, windowMs) {
      const t = Date.now(); const arr = (hits.get(key) ?? []).filter((x) => t - x < windowMs);
      arr.push(t); hits.set(key, arr); return arr.length <= max;
    },
  };
}
