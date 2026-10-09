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
    sellingProposition:
      "Performance you feel, footprint you don't — every pair removes 12 plastic bottles from the ocean.",
    constraints: [
      "No real brand logos or celebrities",
      "Must show the product in motion",
      "End with a clear call to action",
    ],
    objective: "Drive pre-orders for the launch week.",
    duration: "30–60 seconds",
    angles: [
      "A day-in-the-life from sunrise run to night out",
      "Reverse journey: from the shoe back to the ocean",
      "Data-driven: footprint counter on screen",
    ],
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
    targetAudience:
      "College students and café-goers, 18–35, who care about everyday sustainability.",
    sellingProposition: "Turns farm waste into your daily ritual — no plastic, no guilt.",
    constraints: [
      "Must reference the farm-to-cup journey",
      "Indian context encouraged",
      "No disparaging competitors",
    ],
    objective: "Build awareness and drive campus café partnerships.",
    duration: "30–45 seconds",
    angles: [
      "The farmer and the student — two worlds, one cup",
      "ASMR coffee pour with husk textures",
      "Before/after: smoke field vs. café table",
    ],
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
    sellingProposition:
      "Hydration made smart — clean water, zero single-use plastic, gentle nudges.",
    constraints: [
      "Must show the glow reminder feature",
      "Keep claims realistic",
      "Include on-screen product name",
    ],
    objective: "Drive app downloads and first-month sales.",
    duration: "30–60 seconds",
    angles: [
      "Hackathon all-nighter saved by a glowing cap",
      "Humour: the bottle as a personal coach",
      "Futuristic product-reveal spot",
    ],
    toolCategories: ["Image Generation", "Video Generation", "Voice / TTS", "Music / Sound"],
    capacity: 20,
  },
  {
    id: "solar-lantern",
    code: "P-04",
    title: "Sunrise Solar Lantern",
    hook: "Bring the sun home after dark.",
    description:
      "Introduce 'Ujala', a portable solar lantern designed for dependable light during power cuts, outdoor evenings and study sessions. It charges in daylight, has a USB backup port and is built for years of repairable use.",
    targetAudience:
      "Students, families and outdoor explorers who value reliable, lower-impact lighting.",
    sellingProposition:
      "One sunny day of charging, many brighter nights without disposable batteries.",
    constraints: [
      "Show the lantern charging and illuminating a real space",
      "Do not promise a specific runtime without substantiation",
      "Include the product name",
    ],
    objective: "Build trust in practical, everyday solar lighting.",
    duration: "30–45 seconds",
    angles: [
      "A neighbourhood power cut becomes a shared story",
      "Follow one ray of sun into a night-time study session",
      "A lantern passed between generations",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Music / Sound"],
    capacity: 20,
  },
  {
    id: "millet-snack",
    code: "P-05",
    title: "Millet Energy Bites",
    hook: "A little grain. A lot of get-up-and-go.",
    description:
      "Launch 'MileStart', a portable snack made with locally sourced millets, dates and seeds. It is designed for a quick break between lectures, practice and the commute home.",
    targetAudience:
      "Busy college students and young professionals looking for convenient snack options.",
    sellingProposition: "A satisfying, on-the-go bite rooted in familiar ingredients.",
    constraints: [
      "Do not make medical or unverified nutrition claims",
      "Keep the ingredients and packaging believable",
      "End with a memorable product reveal",
    ],
    objective: "Make a locally inspired snack feel exciting to a new generation.",
    duration: "30–45 seconds",
    angles: [
      "A fast-paced day pauses for one small reset",
      "A modern remix of a family snack ritual",
      "Millet grains become the beat of a campus day",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Voice / TTS", "Music / Sound"],
    capacity: 20,
  },
  {
    id: "refill-cleaner",
    code: "P-06",
    title: "Refillable Home-Cleaning Concentrate",
    hook: "Big clean. Small bottle.",
    description:
      "Promote 'ClearDrop', a plant-derived cleaning concentrate supplied in compact refill sachets. Add water at home and reuse the same spray bottle, reducing bulky single-use packaging.",
    targetAudience: "First-time renters and households looking to simplify everyday cleaning.",
    sellingProposition: "A familiar clean with less packaging to carry, store and throw away.",
    constraints: [
      "Follow the product’s label and dilution instructions",
      "Avoid implying the product is harmless or disinfecting without proof",
      "Show a reusable bottle",
    ],
    objective: "Encourage households to switch to a refill routine.",
    duration: "30–60 seconds",
    angles: [
      "A cupboard makeover from clutter to calm",
      "The journey of one bottle through many refills",
      "A tiny sachet takes the lead in a big clean",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "recycled-backpack",
    code: "P-07",
    title: "Recycled-Fabric Everyday Backpack",
    hook: "Carry your day. Leave less behind.",
    description:
      "Introduce 'LoopPack', a durable everyday backpack made from recycled textile fibres, with repairable straps, thoughtful compartments and a simple take-back programme.",
    targetAudience:
      "Students and commuters who need a dependable bag for class, work and weekends.",
    sellingProposition: "Useful design, repairable details and a second life for recovered fabric.",
    constraints: [
      "Show realistic capacity and construction",
      "Avoid unverified recycled-content percentages",
      "Include a clear product name and call to action",
    ],
    objective: "Position repairable design as a practical everyday choice.",
    duration: "30–60 seconds",
    angles: [
      "One backpack follows its owner from class to a weekend trip",
      "A frayed strap gets repaired instead of replaced",
      "Recovered fabric becomes a new campus essential",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "laundry-sheets",
    code: "P-08",
    title: "Low-Waste Laundry Sheets",
    hook: "Laundry day, minus the bulky bottle.",
    description:
      "Launch 'WashFold', pre-measured laundry detergent sheets in recyclable paper packaging. Each lightweight sheet dissolves in the wash, making storage and travel simpler.",
    targetAudience: "Students in hostels, frequent travellers and small households.",
    sellingProposition: "A compact, pre-measured laundry routine with less packaging bulk.",
    constraints: [
      "Do not claim a specific environmental advantage without evidence",
      "Show correct use in a washing machine",
      "Avoid presenting the sheets as edible or child-safe",
    ],
    objective: "Make a simpler laundry routine easy to understand at a glance.",
    duration: "30–45 seconds",
    angles: [
      "A hostel shelf makeover",
      "Pack a whole laundry routine into a travel bag",
      "One sheet dissolves into a quick visual transition",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Music / Sound"],
    capacity: 20,
  },
  {
    id: "community-compost",
    code: "P-09",
    title: "Neighbourhood Compost Starter Kit",
    hook: "Turn kitchen scraps into tomorrow’s soil.",
    description:
      "Showcase 'BackToEarth', a compact home composting kit with a ventilated container, simple sorting guide and access to a local community garden network.",
    targetAudience:
      "Apartment residents, gardening beginners and environmentally curious families.",
    sellingProposition:
      "A guided, small-space first step toward returning food scraps to the soil.",
    constraints: [
      "Represent composting realistically and hygienically",
      "Do not promise odour-free results",
      "Show how finished compost can be used",
    ],
    objective: "Help beginners feel confident taking their first composting step.",
    duration: "30–60 seconds",
    angles: [
      "A banana peel’s second life",
      "A balcony garden told from the soil’s point of view",
      "A small household habit grows into a community",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Voice / TTS"],
    capacity: 20,
  },
  {
    id: "reusable-period-care",
    code: "P-10",
    title: "Reusable Period-Care Pouch",
    hook: "Ready for the day, on your own terms.",
    description:
      "Introduce 'Everyday Ease', a discreet, washable carry pouch with thoughtfully separated compartments for period-care essentials and a small emergency kit.",
    targetAudience: "Students and commuters who want practical, private organisation on the go.",
    sellingProposition: "A considered everyday design that makes preparedness feel simple.",
    constraints: [
      "Use respectful, inclusive language",
      "Do not make medical claims",
      "Avoid shame-based messaging and show the product discreetly",
    ],
    objective: "Present practical period-care organisation as a confident everyday choice.",
    duration: "30–45 seconds",
    angles: [
      "A calm morning that stays on schedule",
      "A friend-to-friend moment of preparedness",
      "The pouch’s quiet role in a full day",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Voice / TTS", "Editing"],
    capacity: 20,
  },
];

export const getProblem = (id: string | null | undefined) =>
  PROBLEMS.find((p) => p.id === id) ?? null;
