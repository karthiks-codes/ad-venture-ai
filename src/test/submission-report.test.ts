import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { PROBLEMS } from "@/config/problems";
import { createSubmissionReportPdf } from "@/lib/submission-report.server";

const testProblem = PROBLEMS.find((problem) => problem.id === "eco-shoes");
if (!testProblem) throw new Error("The eco-shoes test problem is missing.");

describe("team submission PDF report", () => {
  it("creates a readable PDF with submission and feedback content", async () => {
    const bytes = await createSubmissionReportPdf({
      team: {
        teamCode: "ADV-001",
        teamName: "Creative Team",
        member1Name: "Member One",
        member2Name: "Member Two",
        email: "team@example.test",
      },
      problem: testProblem,
      declaration: {
        teamId: "team-1",
        toolIds: ["sample-tool"],
        otherTools: ["Another tool"],
        description: "AI helped us explore and refine different storyboard concepts.",
        eventFeedback: "We enjoyed the event and learned a lot from the challenge.",
        rulesConfirmed: true,
        originalityConfirmed: true,
        createdAt: "2026-10-13T09:00:00.000Z",
      },
      tools: [
        {
          id: "sample-tool",
          name: "Sample AI tool",
          category: "Creative",
          description: "A sample tool",
          url: "https://example.test",
          recommended: false,
          enabled: true,
          order: 1,
        },
      ],
      video: {
        fileName: "final-video.mp4",
        mimeType: "video/mp4",
        size: 42_000_000,
        durationMillis: 95_000,
        width: 1920,
        height: 1080,
      },
      submittedAt: "2026-10-13T09:30:00.000Z",
      timeZone: "Asia/Kolkata",
    });

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
    expect(pdf.getTitle()).toContain("ADV-001");
    expect(pdf.getAuthor()).toBeTruthy();
  });

  it("wraps long and Unicode feedback across report pages", async () => {
    const bytes = await createSubmissionReportPdf({
      team: {
        teamCode: "ADV-002",
        teamName: "Team with feedback",
        member1Name: "First",
        member2Name: "Second",
        email: "team@example.test",
      },
      problem: testProblem,
      declaration: {
        teamId: "team-2",
        toolIds: [],
        description: "AI helped us refine our initial concept into a finished advertisement.",
        eventFeedback: `${"We enjoyed this event. ".repeat(45)} नमस्ते 🎉`,
        rulesConfirmed: true,
        originalityConfirmed: true,
        createdAt: "2026-10-13T09:00:00.000Z",
      },
      tools: [],
      video: {
        fileName: "final-video.mov",
        mimeType: "video/quicktime",
        size: 10_000,
      },
      submittedAt: "2026-10-13T09:30:00.000Z",
      timeZone: "Asia/Kolkata",
    });

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(1);
  });
});
