import type { Settings, SubmissionStatus } from "@/lib/submission-rules";

export type Team = {
  id: string;
  teamCode: string;
  teamName: string;
  member1Name: string;
  member2Name: string;
  email: string;
  passwordHash: string;
  authVersion?: number;
  mustChangePassword: boolean;
  status: "active" | "inactive";
  firstLoginAt: string | null;
  lastLoginAt: string | null;
  problemId: string | null;
  assignedAt: string | null;
  assignedBy: "draw" | "admin" | null;
  submissionStatus: SubmissionStatus;
  challengeViewedAt: string | null;
  isDemo?: boolean;
  /** Present only on temporary public participant demos; expired records are removed by TTL. */
  temporaryDemoExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type NewTeam = Pick<
  Team,
  "teamCode" | "teamName" | "member1Name" | "member2Name" | "email" | "passwordHash"
> &
  Partial<Pick<Team, "mustChangePassword" | "status" | "isDemo" | "temporaryDemoExpiresAt">>;

export type Admin = {
  id: string;
  email: string;
  googleSub: string | null;
  name: string | null;
  role: "owner" | "admin" | "viewer";
  status: "active" | "disabled";
  lastLoginAt: string | null;
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
  uploadSessionUrlEncrypted: string | null;
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
  otherTools?: string[];
  description: string;
  eventFeedback?: string;
  rulesConfirmed: boolean;
  originalityConfirmed: boolean;
  createdAt: string;
  temporaryDemoExpiresAtDate?: Date;
};

export type AuditLog = {
  id: string;
  at: string;
  actor: string;
  action: string;
  teamCode?: string;
  meta?: Record<string, unknown>;
};
export type ResetToken = {
  tokenHash: string;
  teamId: string;
  expiresAt: string;
  usedAt: string | null;
};
export type TeamLoginToken = {
  tokenHash: string;
  teamId: string;
  authVersion: number;
  expiresAt: string;
  usedAt: string | null;
};
export type RepoHealth = {
  kind: "mongodb" | "memory";
  status: "connected" | "error" | "demo";
  latencyMs?: number;
  message?: string;
};

/** Persistence contract. Implementations: MongoRepo (production) and MemoryRepo (explicit DEMO_MODE only). */
export interface Repo {
  readonly kind: "mongodb" | "memory";
  health(): Promise<RepoHealth>;

  listTeams(): Promise<Team[]>;
  getTeam(id: string): Promise<Team | null>;
  findTeamByLogin(identifier: string): Promise<Team | null>;
  /** Throws DuplicateError on teamCode/email collision. */
  createTeam(t: NewTeam): Promise<Team>;
  updateTeam(id: string, patch: Partial<Team>): Promise<Team | null>;
  /** Atomically assign only if team.problemId is null (unless force). Returns updated team or null. */
  assignProblemAtomic(
    teamId: string,
    choose: (counts: Record<string, number>) => string | null,
    by: "draw" | "admin",
    force?: boolean,
  ): Promise<Team | null>;
  assignmentCounts(): Promise<Record<string, number>>;

  getSubmission(teamId: string): Promise<Submission | null>;
  listSubmissions(): Promise<Submission[]>;
  /** Atomically move none/reopened → uploading. Returns null if already submitted. */
  beginSubmission(teamId: string, patch: Partial<Submission>): Promise<Submission | null>;
  updateSubmission(teamId: string, patch: Partial<Submission>): Promise<Submission | null>;
  finalizeSubmission(teamId: string, patch: Partial<Submission>): Promise<Submission | null>;
  reopenSubmission(teamId: string): Promise<Submission | null>;

  listTools(includeDisabled?: boolean): Promise<AiTool[]>;
  upsertTool(tool: AiTool): Promise<AiTool>;

  getDeclaration(teamId: string): Promise<AiDeclaration | null>;
  saveDeclaration(d: AiDeclaration): Promise<void>;

  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  findAdmin(q: { email?: string; googleSub?: string }): Promise<Admin | null>;
  listAdmins(): Promise<Admin[]>;
  upsertAdmin(
    a: Pick<Admin, "email" | "role" | "status"> & Partial<Pick<Admin, "name" | "googleSub">>,
  ): Promise<Admin>;
  recordAdminLogin(email: string, googleSub: string, name: string | null): Promise<Admin | null>;

  log(entry: Omit<AuditLog, "id" | "at">): Promise<void>;
  /** Returns the newest `limit` logs, or all logs when `limit` is zero. */
  listLogs(limit: number): Promise<AuditLog[]>;

  saveResetToken(t: ResetToken): Promise<void>;
  consumeResetToken(tokenHash: string): Promise<ResetToken | null>;
  revokeResetTokens(teamId: string): Promise<void>;
  saveTeamLoginToken(token: TeamLoginToken): Promise<void>;
  getTeamLoginToken(tokenHash: string): Promise<TeamLoginToken | null>;
  consumeTeamLoginToken(tokenHash: string): Promise<TeamLoginToken | null>;
  revokeTeamLoginTokens(teamId: string): Promise<void>;

  /** Records one attempt and returns true if still within limit (shared across instances in Mongo). */
  hitRateLimit(key: string, max: number, windowMs: number): Promise<boolean>;
}

export class DuplicateError extends Error {}
export class PersistenceUnavailableError extends Error {
  readonly status = 503;
}
