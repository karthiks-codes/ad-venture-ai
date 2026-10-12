import { describe, expect, it } from "vitest";
import { pickProblem } from "@/lib/allocation";
import { createMemoryRepo } from "@/lib/db/memory.server";
import { DuplicateError } from "@/lib/db/types";
import { chooseRepo } from "@/lib/db/select";
import { assertSeedAllowed, seedDemo, seedTools } from "@/lib/db/seed";
import { DEMO_TEAMS, DEMO_TOOLS } from "@/lib/db/seed-data";
import { PROBLEMS } from "@/config/problems";

describe("repository selection", () => {
  it("requires MongoDB outside explicit demo mode", () => {
    expect(chooseRepo({ NODE_ENV: "production" })).toMatchObject({ kind: "error" });
  });

  it("rejects in-memory demo persistence in production by default", () => {
    expect(chooseRepo({ NODE_ENV: "production", DEMO_MODE: "true" })).toMatchObject({
      kind: "error",
    });
  });

  it("uses MongoDB when both required settings exist", () => {
    expect(
      chooseRepo({ MONGODB_URI: "mongodb://localhost", MONGODB_DB_NAME: "adventure" }),
    ).toMatchObject({
      kind: "mongodb",
      dbName: "adventure",
    });
  });
});

describe("memory repository behavior in explicitly selected demo mode", () => {
  it("returns all audit events when the log limit is zero", async () => {
    const repo = createMemoryRepo({ seed: false });
    await repo.log({ actor: "admin:test", action: "admin.login" });
    await repo.log({ actor: "team:ADV-001", action: "team.login" });

    expect(await repo.listLogs(0)).toHaveLength(2);
    expect(await repo.listLogs(1)).toHaveLength(1);
  });

  it("normalizes team code and email and rejects duplicates", async () => {
    const repo = createMemoryRepo({ seed: false });
    const team = await repo.createTeam({
      teamCode: " adv-100 ",
      teamName: "Test Team",
      member1Name: "Member One",
      member2Name: "Member Two",
      email: " TEAM@example.test ",
      passwordHash: "hashed-password",
    });
    expect(team.teamCode).toBe("ADV-100");
    expect(team.email).toBe("team@example.test");
    await expect(
      repo.createTeam({
        teamCode: "ADV-100",
        teamName: "Another Team",
        member1Name: "Member One",
        member2Name: "Member Two",
        email: "another@example.test",
        passwordHash: "hashed-password",
      }),
    ).rejects.toBeInstanceOf(DuplicateError);
  });

  it("serializes simultaneous assignments and keeps distribution balanced", async () => {
    const repo = createMemoryRepo({ seed: false });
    const teamIds = await Promise.all(
      Array.from({ length: 30 }, async (_, index) => {
        const team = await repo.createTeam({
          teamCode: `ADV-${String(index + 1).padStart(3, "0")}`,
          teamName: `Team ${index + 1}`,
          member1Name: "Member One",
          member2Name: "Member Two",
          email: `team${index + 1}@example.test`,
          passwordHash: "hashed-password",
        });
        return team.id;
      }),
    );

    const assignments = await Promise.all(
      teamIds.map((teamId) =>
        repo.assignProblemAtomic(
          teamId,
          (counts) => pickProblem({ problems: PROBLEMS, counts, random: () => 0 }),
          "draw",
        ),
      ),
    );
    expect(assignments.every(Boolean)).toBe(true);
    const counts = Object.values(await repo.assignmentCounts());
    expect(counts.reduce((total, count) => total + count, 0)).toBe(30);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });

  it("keeps the period-care challenge out of the current problem set", () => {
    expect(PROBLEMS.some((problem) => problem.id === "reusable-period-care")).toBe(false);
  });

  it("does not start a second upload while the first is interrupted", async () => {
    const repo = createMemoryRepo({ seed: false });
    const team = await repo.createTeam({
      teamCode: "ADV-999",
      teamName: "Upload Team",
      member1Name: "Member One",
      member2Name: "Member Two",
      email: "upload@example.test",
      passwordHash: "hashed-password",
    });
    expect(await repo.beginSubmission(team.id, { driveFileName: "final.mp4" })).toMatchObject({
      status: "uploading",
    });
    expect(await repo.beginSubmission(team.id, { driveFileName: "different.mp4" })).toBeNull();
  });

  it("allows only one finalization for a reserved submission", async () => {
    const repo = createMemoryRepo({ seed: false });
    const team = await repo.createTeam({
      teamCode: "ADV-998",
      teamName: "Finalize Team",
      member1Name: "Member One",
      member2Name: "Member Two",
      email: "finalize@example.test",
      passwordHash: "hashed-password",
    });
    await repo.beginSubmission(team.id, { driveFileName: "final-video.mp4" });
    const results = await Promise.all([
      repo.finalizeSubmission(team.id, { driveFileId: "file-one" }),
      repo.finalizeSubmission(team.id, { driveFileId: "file-two" }),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await repo.getSubmission(team.id))?.status).toBe("submitted");
  });

  it("consumes a password-reset token exactly once", async () => {
    const repo = createMemoryRepo({ seed: false });
    const team = await repo.createTeam({
      teamCode: "ADV-997",
      teamName: "Reset Team",
      member1Name: "Member One",
      member2Name: "Member Two",
      email: "reset@example.test",
      passwordHash: "hashed-password",
    });
    const token = {
      tokenHash: "token-hash",
      teamId: team.id,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      usedAt: null,
    };
    await repo.saveResetToken(token);
    expect(await repo.consumeResetToken(token.tokenHash)).toMatchObject({ teamId: team.id });
    expect(await repo.consumeResetToken(token.tokenHash)).toBeNull();
  });

  it("revokes outstanding reset tokens after a password change", async () => {
    const repo = createMemoryRepo({ seed: false });
    const team = await repo.createTeam({
      teamCode: "ADV-996",
      teamName: "Revoked Reset Team",
      member1Name: "Member One",
      member2Name: "Member Two",
      email: "revoke@example.test",
      passwordHash: "hashed-password",
    });
    await repo.saveResetToken({
      tokenHash: "pending-reset",
      teamId: team.id,
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      usedAt: null,
    });
    await repo.revokeResetTokens(team.id);
    expect(await repo.consumeResetToken("pending-reset")).toBeNull();
  });
});

describe("explicit MongoDB seed safety", () => {
  it("requires confirmation and refuses production-like databases by default", () => {
    expect(() => assertSeedAllowed({ MONGODB_DB_NAME: "adventure" }, [])).toThrow(/--confirm/);
    expect(() =>
      assertSeedAllowed({ NODE_ENV: "production", MONGODB_DB_NAME: "adventure" }, ["--confirm"]),
    ).toThrow(/production-like/);
  });

  it("upserts only the sample tools without creating or changing teams", async () => {
    const repo = createMemoryRepo({ seed: false });
    const toolsUpserted = await seedTools(repo);

    expect(toolsUpserted).toBe(DEMO_TOOLS.length);
    expect(await repo.listTools(true)).toEqual(DEMO_TOOLS);
    expect(await repo.listTeams()).toEqual([]);
  });

  it("seeds synthetic team fixtures idempotently using supplied temporary passwords", async () => {
    const repo = createMemoryRepo({ seed: false });
    const passwords = Object.fromEntries(
      DEMO_TEAMS.map((team) => [team.teamCode, "temporary-password-not-printed"]),
    );
    const first = await seedDemo(repo, passwords);
    const second = await seedDemo(repo, passwords);
    expect(first.teamsCreated).toHaveLength(DEMO_TEAMS.length);
    expect(second.teamsCreated).toHaveLength(0);
    expect(second.teamsSkipped).toHaveLength(DEMO_TEAMS.length);
    expect(
      (await repo.listTeams()).every((team) => team.passwordHash !== passwords[team.teamCode]),
    ).toBe(true);
    expect(
      (await repo.listTeams()).every((team) => team.email.endsWith("@teams.adventure.test")),
    ).toBe(true);
  }, 15_000);
});
