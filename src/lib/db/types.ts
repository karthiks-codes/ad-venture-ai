import type { Settings, SubmissionStatus } from "@/lib/submission-rules";

export type Team = {
  id: string;
  teamCode: string;
  teamName: string;
  member1Name: string;
  member2Name: string;
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  status: "active" | "inactive";
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  problemId: string | null;
  assignedAt: string | null;
  assignedBy: "draw" | "admin" | null;
  submissionStatus: SubmissionStatus;
  toolkitViewedAt: string | null;
  challengeViewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Submission = {
  teamId: string;
  status: SubmissionStatus;
  driveFolderId: string | null;
  driveFileId: string | null;
  driveFileName: string | null;
  driveFileSize: number | null;
  driveWebViewLink: string | null;
  mimeType: string | null;
  uploadStartedAt: string | null;
  uploadCompletedAt: string | null;
  attempts: number;
};

export type AiTool = {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  recommended: boolean;
  enabled: boolean;
  order: number;
};

export type AiDeclaration = {
  teamId: string;
  toolIds: string[];
  description: string;
  rulesConfirmed: boolean;
  originalityConfirmed: boolean;
  createdAt: string;
};

export type AuditLog = { id: string; at: string; actor: string; action: string; teamCode?: string; meta?: Record<string, unknown> };
export type ResetToken = { tokenHash: string; teamId: string; expiresAt: string; usedAt: string | null };

/** Persistence contract. Implementations: memory (demo) and MongoDB (production). */
export interface Repo {
  listTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | null>;
  findTeamByLogin(identifier: string): Promise<Team | null>;
  updateTeam(id: string, patch: Partial<Team>): Promise<Team | null>;
  /** Atomically assign only if team.problemId is null AND capacity allows. Returns updated team or null. */
  assignProblemAtomic(teamId: string, choose: (counts: Record<string, number>) => string | null, by: "draw" | "admin", force?: boolean): Promise<Team | null>;
  assignmentCounts(): Promise<Record<string, number>>;

  getSubmission(teamId: string): Promise<Submission | null>;
  listSubmissions(): Promise<Submission[]>;
  /** Atomically move none/reopened → uploading. Returns null if already submitted. */
  beginSubmission(teamId: string, patch: Partial<Submission>): Promise<Submission | null>;
  updateSubmission(teamId: string, patch: Partial<Submission>): Promise<Submission | null>;

  listTools(includeDisabled?: boolean): Promise<AiTool[]>;
  upsertTool(tool: AiTool): Promise<AiTool>;

  getDeclaration(teamId: string): Promise<AiDeclaration | null>;
  saveDeclaration(d: AiDeclaration): Promise<void>;

  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  log(entry: Omit<AuditLog, "id" | "at">): Promise<void>;
  listLogs(limit: number): Promise<AuditLog[]>;

  saveResetToken(t: ResetToken): Promise<void>;
  consumeResetToken(tokenHash: string): Promise<ResetToken | null>;
}
