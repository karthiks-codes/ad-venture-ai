import { describe, expect, it } from "vitest";
import { parseTeamCsv } from "@/lib/team-import";

describe("team CSV import parser", () => {
  it("maps required headers regardless of order and handles quoted commas", () => {
    const rows = parseTeamCsv(
      '\uFEFFemail,member2Name,teamName,teamCode,member1Name\r\n"team@example.test",Member Two,"Team, Alpha",ADV-001,Member One\r\n',
    );
    expect(rows).toEqual([
      {
        rowNumber: 2,
        values: {
          teamCode: "ADV-001",
          teamName: "Team, Alpha",
          member1Name: "Member One",
          member2Name: "Member Two",
          email: "team@example.test",
        },
      },
    ]);
  });

  it("supports escaped quotes and ignores blank records", () => {
    const rows = parseTeamCsv(
      'teamCode,teamName,member1Name,member2Name,email\nADV-001,"The ""A"" Team",One,Two,team@example.test\n\n',
    );
    expect(rows[0]?.values["teamName"]).toBe('The "A" Team');
  });

  it("rejects missing headers, malformed quotes, and excessive row counts", () => {
    expect(() => parseTeamCsv("teamCode,teamName\nADV-001,Team")).toThrow(/headers/);
    expect(() =>
      parseTeamCsv(
        'teamCode,teamName,member1Name,member2Name,email\nADV-001,"unfinished,One,Two,e@test.test',
      ),
    ).toThrow(/unterminated/);
    expect(() =>
      parseTeamCsv(
        'teamCode,teamName,member1Name,member2Name,email\nADV-001,"Team" suffix,One,Two,e@test.test',
      ),
    ).toThrow(/after a quoted field/);
    const records = Array.from(
      { length: 201 },
      (_, index) => `ADV-${index},Team ${index},One,Two,team${index}@example.test`,
    ).join("\n");
    expect(() =>
      parseTeamCsv(`teamCode,teamName,member1Name,member2Name,email\n${records}`),
    ).toThrow(/at most 200/);
  });
});
