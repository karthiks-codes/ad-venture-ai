import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { AiDeclaration, AiTool } from "@/lib/db/types";
import type { ProblemStatement } from "@/config/problems";
import { EVENT } from "@/config/event";

type SubmissionReportData = {
  team: {
    teamCode: string;
    teamName: string;
    member1Name: string;
    member2Name: string;
    email: string;
  };
  problem: ProblemStatement;
  declaration: AiDeclaration;
  tools: AiTool[];
  video: {
    fileName: string;
    mimeType: string;
    size: number;
    webViewLink?: string;
    durationMillis?: number | string;
    width?: number;
    height?: number;
  };
  submittedAt: string;
  timeZone: string;
};

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 48;
const BODY_WIDTH = PAGE_WIDTH - MARGIN * 2;
const NAVY = rgb(0.055, 0.09, 0.19);
const CYAN = rgb(0.08, 0.64, 0.78);
const CORAL = rgb(0.95, 0.43, 0.28);
const INK = rgb(0.12, 0.17, 0.25);
const MUTED = rgb(0.39, 0.45, 0.54);
const PALE = rgb(0.95, 0.97, 0.99);
const WHITE = rgb(1, 1, 1);

function pdfSafeText(value: string): string {
  const punctuation: Record<string, string> = {
    "\u2018": "'",
    "\u2019": "'",
    "\u201c": '"',
    "\u201d": '"',
    "\u2013": "-",
    "\u2014": "-",
    "\u2022": "*",
    "\u2026": "...",
    "\u00a0": " ",
  };
  return Array.from(value.normalize("NFKD"))
    .filter((character) => !/\p{M}/u.test(character))
    .map((character) => {
      if (punctuation[character]) return punctuation[character];
      if (character === "\n" || character === "\r") return character;
      if (character === "\t") return " ";
      const codePoint = character.codePointAt(0)!;
      if (codePoint >= 32 && codePoint <= 126) return character;
      return `[U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}]`;
    })
    .join("");
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of pdfSafeText(text).split(/\r?\n/)) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(candidate, fontSize) > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function formatFileSize(size: number): string {
  if (!Number.isFinite(size) || size < 0) return "Unavailable";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value.toFixed(unit === 0 ? 0 : 2)} ${units[unit]}`;
}

function formatDuration(durationMillis?: number | string): string {
  const milliseconds = Number(durationMillis);
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "Not available from Drive";
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function formatSubmittedAt(value: string, timeZone: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Submission timestamp is invalid.");
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

export async function createSubmissionReportPdf(data: SubmissionReportData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  document.setTitle(`${data.team.teamCode} - ADventure ${EVENT.year} Submission Report`);
  document.setAuthor(EVENT.organizer);
  document.setSubject("Team video submission, AI declaration, and event feedback");
  document.setCreator("ADventure 2026");

  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  let page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const pages: PDFPage[] = [page];
  let cursorY = 0;

  function decoratePage(target: PDFPage) {
    target.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: PALE });
    target.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - 104,
      width: PAGE_WIDTH,
      height: 104,
      color: NAVY,
    });
    target.drawRectangle({ x: 0, y: PAGE_HEIGHT - 108, width: PAGE_WIDTH, height: 4, color: CYAN });
    target.drawText("ADventure 2026", {
      x: MARGIN,
      y: PAGE_HEIGHT - 48,
      size: 11,
      font: bold,
      color: CYAN,
    });
    target.drawText("TEAM SUBMISSION REPORT", {
      x: MARGIN,
      y: PAGE_HEIGHT - 78,
      size: 19,
      font: bold,
      color: WHITE,
    });
  }

  decoratePage(page);
  cursorY = PAGE_HEIGHT - 142;

  function addPage() {
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    decoratePage(page);
    cursorY = PAGE_HEIGHT - 142;
  }

  function ensureSpace(height: number) {
    if (cursorY - height < 58) addPage();
  }

  function section(title: string) {
    ensureSpace(34);
    page.drawText(pdfSafeText(title.toUpperCase()), {
      x: MARGIN,
      y: cursorY,
      size: 9,
      font: bold,
      color: CYAN,
    });
    page.drawLine({
      start: { x: MARGIN, y: cursorY - 8 },
      end: { x: MARGIN + BODY_WIDTH, y: cursorY - 8 },
      thickness: 0.7,
      color: rgb(0.82, 0.86, 0.9),
    });
    cursorY -= 27;
  }

  function paragraph(label: string, value: string) {
    const safeLabel = pdfSafeText(label);
    const valueLines = wrapText(value || "Not provided", regular, 9.5, BODY_WIDTH);
    ensureSpace(30);
    page.drawText(safeLabel, {
      x: MARGIN,
      y: cursorY,
      size: 8,
      font: bold,
      color: MUTED,
    });
    cursorY -= 13;
    for (const line of valueLines) {
      ensureSpace(14);
      page.drawText(line, {
        x: MARGIN,
        y: cursorY,
        size: 9.5,
        font: regular,
        color: INK,
      });
      cursorY -= 13;
    }
    cursorY -= 7;
  }

  page.drawText(pdfSafeText(data.team.teamCode), {
    x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(pdfSafeText(data.team.teamCode), 11) - 12,
    y: PAGE_HEIGHT - 48,
    size: 11,
    font: bold,
    color: WHITE,
  });

  section("Team");
  paragraph("Team name", data.team.teamName);
  paragraph("Team members", `${data.team.member1Name} and ${data.team.member2Name}`);
  paragraph("Registered email", data.team.email);

  section("Assigned problem statement");
  paragraph("Challenge", `${data.problem.code} - ${data.problem.title}`);
  paragraph("Product summary", data.problem.summary);
  paragraph("Challenge brief", data.problem.description);
  paragraph("Unique selling proposition", data.problem.sellingProposition);
  if (data.problem.features?.length) {
    paragraph("Product features", data.problem.features.join("; "));
  }
  if (data.problem.objective) paragraph("Campaign objective", data.problem.objective);
  if (data.problem.duration) paragraph("Suggested duration", data.problem.duration);
  if (data.problem.constraints?.length) {
    paragraph("Brief constraints", data.problem.constraints.join("; "));
  }
  if (data.problem.angles?.length) {
    paragraph("Suggested creative angles", data.problem.angles.join("; "));
  }

  section("AI usage declaration");
  const toolsById = new Map(data.tools.map((tool) => [tool.id, tool]));
  const selectedTools = data.declaration.toolIds.map(
    (id) => toolsById.get(id)?.name ?? `Tool (${id})`,
  );
  paragraph("Sample AI tools used", selectedTools.join(", "));
  paragraph("Other AI tools used", data.declaration.otherTools?.join(", ") || "None listed");
  paragraph("How AI contributed", data.declaration.description);
  paragraph(
    "Team confirmations",
    `Event rules: ${data.declaration.rulesConfirmed ? "Confirmed" : "Not confirmed"}; ` +
      `originality and usage rights: ${data.declaration.originalityConfirmed ? "Confirmed" : "Not confirmed"}.`,
  );

  section("Event experience");
  paragraph("Team feedback", data.declaration.eventFeedback ?? "Not provided");

  section("Final video submission");
  paragraph("Submitted at", formatSubmittedAt(data.submittedAt, data.timeZone));
  paragraph("Video file", data.video.fileName);
  paragraph("File size", formatFileSize(data.video.size));
  paragraph("Video format", data.video.mimeType);
  paragraph("Video duration", formatDuration(data.video.durationMillis));
  if (data.video.width && data.video.height) {
    paragraph("Video resolution", `${data.video.width} x ${data.video.height}`);
  }
  if (data.video.webViewLink) paragraph("Google Drive link", data.video.webViewLink);

  pages.forEach((item, index) => {
    item.drawText(
      `ADventure ${EVENT.year}  |  ${data.team.teamCode}  |  ${index + 1}/${pages.length}`,
      {
        x: MARGIN,
        y: 30,
        size: 8,
        font: regular,
        color: MUTED,
      },
    );
    item.drawRectangle({
      x: PAGE_WIDTH - MARGIN - 16,
      y: 29,
      width: 7,
      height: 7,
      color: index % 2 === 0 ? CORAL : CYAN,
    });
  });

  return document.save();
}
