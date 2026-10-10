// Static, public event identity. Timing used for business logic lives in eventSettings (DB), not here.
export const EVENT = {
  name: "ADventure",
  year: 2026,
  tagline: "One Product. Endless Possibilities.",
  organizer: "BVRIT Hyderabad College of Engineering for Women",
  department: "Department of CSE (AI & ML)",
  umbrella: "Innovation Day",
  dateLabel: "13 October 2026 · Tuesday",
  timeLabel: "1:30 PM – 4:00 PM IST",
  venue: "PB-G3, G4",
  teamSize: 2,
} as const;

export const CRITERIA = [
  {
    key: "creativity",
    title: "Creativity & Originality",
    desc: "A fresh, unexpected idea that only your team could have made.",
  },
  {
    key: "story",
    title: "Storytelling",
    desc: "A clear arc — hook, tension, payoff — in seconds.",
  },
  {
    key: "production",
    title: "Video Production Quality",
    desc: "Visual polish, pacing, sound and edit craft.",
  },
  {
    key: "impact",
    title: "Overall Impact",
    desc: "The lasting impression your ad leaves on the jury.",
  },
] as const;

export const STEPS = [
  "Log in with your team credentials",
  "Draw your product challenge",
  "Conceptualize the advertisement",
  "Create assets with AI tools",
  "Edit your short video",
  "Submit the final video once",
] as const;

export const TIMELINE = [
  { time: "1:30 PM", label: "Check-in & team login" },
  { time: "1:40 PM", label: "Problem statement draw" },
  { time: "1:45 PM", label: "Ideation, AI creation & editing" },
  { time: "3:30 PM", label: "Submission deadline (default)" },
  { time: "4:00 PM", label: "Wrap-up" },
] as const;
