// In-memory DEMO repository. Data resets on server restart. Single-threaded JS
// makes each method atomic, mirroring the conditional updates used in MongoDB.
import bcrypt from "bcryptjs";
import type { AiDeclaration, AiTool, AuditLog, Repo, ResetToken, Submission, Team } from "./types";
import type { Settings } from "@/lib/submission-rules";
import { DEMO_PASSWORD, DEMO_TEAMS, DEMO_TOOLS } from "./seed-data";
import { getProblem } from "@/config/problems";

const now = () => new Date().toISOString();

export function createMemoryRepo(): Repo {
  const hash = bcrypt.hashSync(DEMO_PASSWORD, 8);
  const teams = new Map<string, Team>();
  const submissions = new Map<string, Submission>();
  const declarations = new Map<string, AiDeclaration>();
  const tools = new Map<string, AiTool>(DEMO_TOOLS.map((t) => [t.id, { ...t }]));
  const logs: AuditLog[] = [];
  const tokens = new Map<string, ResetToken>();
  const today = new Date();
  let settings: Settings = {
    eventStartAt: new Date(today.getTime() - 3600_000).toISOString(),
    submissionDeadline: new Date(today.getTime() + 6 * 3600_000).toISOString(),
    timezone: "Asia/Kolkata",
    maxVideoSizeBytes: 1.5 * 1024 ** 3,
    allowedVideoTypes: ["video/mp4", "video/quicktime"],
    uploadEnabled: true,
    eventActive: true,
  };

  DEMO_TEAMS.forEach((d, i) => {
    const id = `team_${i + 1}`;
    const ts = now();
    teams.set(id, {
      id, ...d, passwordHash: hash, status: "active",
      firstLoginAt: d.mustChangePassword ? null : ts, lastLoginAt: null,
      problemId: d.problemId, assignedAt: d.problemId ? ts : null, assignedBy: d.problemId ? "draw" : null,
      submissionStatus: d.submissionStatus, toolkitViewedAt: null, challengeViewedAt: d.problemId ? ts : null,
      createdAt: ts, updatedAt: ts,
    });
    if (d.submissionStatus === "submitted") {
      submissions.set(id, {
        teamId: id, status: "submitted", driveFolderId: "demo-folder", driveFileId: "demo-file",
        driveFileName: "final-video.mp4", driveFileSize: 734_003_200, driveWebViewLink: null, mimeType: "video/mp4",
        uploadStartedAt: ts, uploadCompletedAt: ts, attempts: 1,
      });
      declarations.set(id, { teamId: id, toolIds: ["chatgpt", "runway", "elevenlabs"], description: "Demo declaration.", rulesConfirmed: true, originalityConfirmed: true, createdAt: ts });
    }
  });

  const counts = () => {
    const c: Record<string, number> = {};
    teams.forEach((t) => { if (t.problemId) c[t.problemId] = (c[t.problemId] ?? 0) + 1; });
    return c;
  };

  return {
    async listTeams() { return [...teams.values()]; },
    async getTeam(id) { return teams.get(id) ?? null; },
    async findTeamByLogin(identifier) {
      const q = identifier.trim().toLowerCase();
      return [...teams.values()].find((t) => t.teamCode.toLowerCase() === q || t.email.toLowerCase() === q) ?? null;
    },
    async updateTeam(id, patch) {
      const t = teams.get(id); if (!t) return null;
      const n = { ...t, ...patch, updatedAt: now() }; teams.set(id, n); return n;
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
        teamId, status: "uploading", driveFolderId: null, driveFileId: null, driveFileName: null, driveFileSize: null,
        driveWebViewLink: null, mimeType: null, uploadStartedAt: now(), uploadCompletedAt: null,
        attempts: (s?.attempts ?? 0) + 1, ...patch,
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
    async log(e) { logs.unshift({ ...e, id: crypto.randomUUID(), at: now() }); if (logs.length > 500) logs.pop(); },
    async listLogs(limit) { return logs.slice(0, limit); },
    async saveResetToken(t) { tokens.set(t.tokenHash, t); },
    async consumeResetToken(h) {
      const t = tokens.get(h);
      if (!t || t.usedAt || new Date(t.expiresAt) < new Date()) return null;
      t.usedAt = now(); return t;
    },
  };
}
