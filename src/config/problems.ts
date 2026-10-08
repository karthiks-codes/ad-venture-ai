// STATIC problem statement configuration — the single source of truth.
// Replace / extend these (10–12 expected on event day). Only the team→problem
// mapping is stored in the database. `capacity` caps how many teams may draw it.
export type ProblemStatement = {
  id: string;
  code: string;
  title: string;
  hook: string;
  description: string;
  targetAudience: string;
  sellingProposition: string;
  constraints: string[];
  objective: string;
  duration: string;
  angles: string[];
  toolCategories: string[];
  capacity: number;
};

export const PROBLEMS: ProblemStatement[] = [
  {
    id: "eco-shoes",
    code: "P-01",
    title: "Eco-Friendly Shoes",
    hook: "Sneakers that walk lighter on the planet.",
    description:
      "Launch 'Terra Step', a running shoe made from recycled ocean plastic and natural rubber, with a fully compostable insole. The brand wants to prove sustainable can also mean high-performance and stylish.",
    targetAudience: "Urban Gen-Z and young professionals, 18–30, fitness- and style-conscious.",
    sellingProposition: "Performance you feel, footprint you don't — every pair removes 12 plastic bottles from the ocean.",
    constraints: ["No real brand logos or celebrities", "Must show the product in motion", "End with a clear call to action"],
    objective: "Drive pre-orders for the launch week.",
    duration: "30–60 seconds",
    angles: ["A day-in-the-life from sunrise run to night out", "Reverse journey: from the shoe back to the ocean", "Data-driven: footprint counter on screen"],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Music / Sound"],
    capacity: 20,
  },
  {
    id: "rice-husk-cups",
    code: "P-02",
    title: "Rice Husk Coffee Cups",
    hook: "Your morning coffee, served by the harvest.",
    description:
      "Introduce 'HuskBrew', reusable coffee cups made from rice husk — an agricultural by-product usually burned. Durable, BPA-free, dishwasher-safe, and biodegradable at end of life.",
    targetAudience: "College students and café-goers, 18–35, who care about everyday sustainability.",
    sellingProposition: "Turns farm waste into your daily ritual — no plastic, no guilt.",
    constraints: ["Must reference the farm-to-cup journey", "Indian context encouraged", "No disparaging competitors"],
    objective: "Build awareness and drive campus café partnerships.",
    duration: "30–45 seconds",
    angles: ["The farmer and the student — two worlds, one cup", "ASMR coffee pour with husk textures", "Before/after: smoke field vs. café table"],
    toolCategories: ["Script & Copy", "Image Generation", "Voice / TTS", "Editing"],
    capacity: 20,
  },
  {
    id: "smart-bottle",
    code: "P-03",
    title: "Smart Sustainable Water Bottle",
    hook: "The bottle that reminds you to stay alive (and kind to Earth).",
    description:
      "Promote 'AquaPulse', a stainless-steel bottle with a glowing hydration reminder cap, UV self-cleaning, and a companion app that tracks plastic bottles saved.",
    targetAudience: "Students, coders and gym-goers, 16–30, who forget to drink water.",
    sellingProposition: "Hydration made smart — clean water, zero single-use plastic, gentle nudges.",
    constraints: ["Must show the glow reminder feature", "Keep claims realistic", "Include on-screen product name"],
    objective: "Drive app downloads and first-month sales.",
    duration: "30–60 seconds",
    angles: ["Hackathon all-nighter saved by a glowing cap", "Humour: the bottle as a personal coach", "Futuristic product-reveal spot"],
    toolCategories: ["Image Generation", "Video Generation", "Voice / TTS", "Music / Sound"],
    capacity: 20,
  },
];

export const getProblem = (id: string | null | undefined) => PROBLEMS.find((p) => p.id === id) ?? null;
