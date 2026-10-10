import { describe, expect, it } from "vitest";
import { pickProblem } from "@/lib/allocation";
import { canStartUpload, type Settings } from "@/lib/submission-rules";

const problems = [
  { id: "a", capacity: 2 },
  { id: "b", capacity: 2 },
  { id: "c", capacity: 2 },
];

describe("pickProblem", () => {
  it("picks the least-assigned problem", () => {
    expect(pickProblem({ problems, counts: { a: 1, b: 0, c: 1 }, random: () => 0.9 })).toBe("b");
  });
  it("never exceeds capacity", () => {
    expect(pickProblem({ problems, counts: { a: 2, b: 2, c: 2 }, random: Math.random })).toBeNull();
  });
  it("stays balanced over many draws", () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 6; i++) {
      const id = pickProblem({ problems, counts, random: Math.random })!;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    expect(counts).toEqual({ a: 2, b: 2, c: 2 });
  });
});

const settings: Settings = {
  eventStartAt: "2026-10-13T08:00:00Z",
  submissionDeadline: "2026-10-13T10:00:00Z",
  timezone: "Asia/Kolkata",
  maxVideoSizeBytes: 1024 ** 3,
  allowedVideoTypes: ["video/mp4"],
  uploadEnabled: true,
  emailServiceEnabled: true,
  eventActive: true,
};
const base = {
  settings,
  now: new Date("2026-10-13T09:00:00Z"),
  status: "none" as const,
  hasProblem: true,
  hasDeclaration: true,
  file: { size: 500 * 1024 ** 2, type: "video/mp4", name: "ad.mp4" },
};

describe("canStartUpload", () => {
  it("allows a valid upload", () => expect(canStartUpload(base).ok).toBe(true));
  it("blocks after deadline", () =>
    expect(canStartUpload({ ...base, now: new Date("2026-10-13T11:00:00Z") }).ok).toBe(false));
  it("blocks before event start", () =>
    expect(canStartUpload({ ...base, now: new Date("2026-10-13T07:59:59Z") }).ok).toBe(false));
  it("blocks an invalid event window", () =>
    expect(
      canStartUpload({
        ...base,
        settings: { ...settings, eventStartAt: "not-a-date" },
      }).ok,
    ).toBe(false));
  it("blocks second submission", () =>
    expect(canStartUpload({ ...base, status: "submitted" }).ok).toBe(false));
  it("blocks oversize", () =>
    expect(canStartUpload({ ...base, file: { ...base.file, size: 2 * 1024 ** 3 } }).ok).toBe(
      false,
    ));
  it("blocks wrong type", () =>
    expect(canStartUpload({ ...base, file: { ...base.file, type: "video/webm" } }).ok).toBe(false));
});
