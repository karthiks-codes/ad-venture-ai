// STATIC problem statement configuration — the single source of truth.
// Only team→problem mappings are stored in the database. `capacity` caps how many teams may draw it.
export type ProblemStatement = {
  /** Public route alias, kept stable for existing links. */
  id: string;
  /** Versioned persistence key used for new assignments. */
  assignmentId?: string;
  code: string;
  title: string;
  summary: string;
  description: string;
  targetAudience: string;
  sellingProposition: string;
  features?: string[];
  toolCategories: string[];
  capacity: number;
  archived?: boolean;
  objective?: string;
  duration?: string;
  constraints?: string[];
  angles?: string[];
};

export const PROBLEMS: ProblemStatement[] = [
  {
    id: "rice-husk-cups",
    assignmentId: "adventure-2026-v2-p01",
    code: "P-01",
    title: "HuskCup — Sustainable Rice-Husk Cup",
    summary: "A practical reusable or disposable cup made partly from rice husk.",
    description:
      "HuskCup is a cup made from rice husk and other suitable materials, offering a practical alternative to conventional drinkware. It makes productive use of rice husk, an agricultural by-product that may otherwise go unused. The product can be designed for reuse or single use, with material performance and end-of-life claims based on its actual specification.",
    targetAudience: "People seeking practical drinkware and more considered material choices.",
    sellingProposition:
      "Useful everyday drinkware that makes productive use of rice-processing by-products.",
    features: [
      "Rice-husk composite body",
      "Lightweight everyday cup form",
      "Reusable or single-use product direction",
      "Material and end-of-life claims tied to the final specification",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "recycled-backpack",
    assignmentId: "adventure-2026-v2-p02",
    code: "P-02",
    title: "VoltPack — Solar Charging Backpack",
    summary: "An urban commuter backpack with storage and solar-assisted charging.",
    description:
      "VoltPack is a practical urban backpack for commuters carrying daily essentials and devices away from a power outlet. It has multiple storage compartments, a dedicated laptop compartment, USB charging ports connected to a power bank, and an integrated solar panel that provides supplemental charging. Its distinguishing feature is the combination of organized commuter storage and solar-assisted device charging in one bag.",
    targetAudience: "Urban commuters and students carrying a laptop and mobile devices.",
    sellingProposition:
      "Combines organized everyday carry with supplemental solar charging in one commuter backpack.",
    features: [
      "Multiple compartments for daily essentials",
      "Dedicated laptop compartment",
      "Integrated solar panel for supplemental charging",
      "USB charging ports connected to a power bank",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "smart-bottle",
    assignmentId: "adventure-2026-v2-p03",
    code: "P-03",
    title: "HydroHalo — Sustainable Smart Water Bottle",
    summary:
      "A reusable stainless-steel bottle with hydration reminders and one-touch, two-minute sterilization.",
    description:
      "HydroHalo is a reusable stainless-steel water bottle for people who want durable drinkware and a simple way to remember to hydrate. Along with hydration reminders, it offers a one-touch sterilization cycle designed to run for two minutes. A companion application is available as an optional extension. The durable metal construction and built-in prompts distinguish it from ordinary reusable bottles without relying on unsupported health claims.",
    targetAudience: "People who want durable reusable drinkware and hydration reminders.",
    sellingProposition:
      "Pairs reusable metal drinkware and hydration prompts with a convenient one-touch, two-minute sterilization cycle.",
    features: [
      "Reusable stainless-steel construction",
      "Hydration reminders",
      "One-touch, two-minute sterilization cycle",
      "Optional companion app",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "personal-safety-device",
    assignmentId: "adventure-2026-v2-p04",
    code: "P-04",
    title: "SafeSignal — Personal Safety Device",
    summary: "A compact wearable or keychain device for requesting attention in an emergency.",
    description:
      "SafeSignal is a compact wearable or keychain device for people who want an accessible way to alert others in an emergency. Its physical controls include a loud emergency alarm and an SOS button, with smartphone-connected location sharing as an optional feature. Portability and direct access to the alarm controls are central to its usefulness.",
    targetAudience: "People looking for a compact, accessible personal safety alert.",
    sellingProposition:
      "Combines a physical alarm and SOS control in a portable device, with optional connected location sharing.",
    features: [
      "Compact wearable or keychain form",
      "Physical SOS button",
      "Loud emergency alarm",
      "Optional smartphone-connected location sharing",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "protein-bar",
    assignmentId: "adventure-2026-v2-p05",
    code: "P-05",
    title: "BloomBite — Protein Bar",
    summary: "A convenient snack bar made with familiar ingredients and plant-based protein.",
    description:
      "BloomBite is an individually packaged protein bar for people who need a convenient snack during a busy day. Its recipe can use familiar ingredients such as dates, oats, nuts, and plant-based protein, giving the bar a recognizable texture and ingredient profile. The product is positioned as a practical portable snack, without relying on unsupported nutritional or health claims.",
    targetAudience: "People looking for a convenient snack during busy days.",
    sellingProposition:
      "A portable bar combining plant-based protein with familiar ingredients in a convenient individual serving.",
    features: [
      "Convenient individual packaging",
      "Plant-based protein",
      "Familiar recipe ingredients such as dates, oats, and nuts",
      "Portable snack format",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "eco-shoes",
    assignmentId: "adventure-2026-v2-p06",
    code: "P-06",
    title: "Evertrail — Sustainable Sneakers",
    summary: "Contemporary everyday sneakers made partly from recycled materials.",
    description:
      "Evertrail is a contemporary everyday sneaker for people looking for practical comfort and modern styling. It uses recycled materials in part, combining considered material choices with a familiar wearable silhouette. The product's distinction is this mix of everyday function and partial use of recycled materials; no specific recycled-content percentage is assumed.",
    targetAudience:
      "People seeking comfortable everyday footwear with considered material choices.",
    sellingProposition:
      "Combines a contemporary everyday silhouette and practical comfort with partial use of recycled materials.",
    features: [
      "Contemporary everyday sneaker silhouette",
      "Recycled materials used in part",
      "Practical comfort for regular wear",
      "Material content described without unsupported percentages",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "personalized-jewelry",
    assignmentId: "adventure-2026-v2-p07",
    code: "P-07",
    title: "Dearly — Personalized Keepsake Jewellery",
    summary: "Customizable physical jewellery featuring a short personal detail.",
    description:
      "Dearly is a customizable piece of physical jewellery for people seeking a wearable personal keepsake or gift. Necklaces, bracelets, or pendants can be personalized with initials, a date, or a short message, with a neutral gift box as an optional presentation. Its differentiator is the ability to make a simple piece personal through a chosen detail.",
    targetAudience: "People looking for customizable jewellery as a personal keepsake or gift.",
    sellingProposition:
      "Turns a short personal detail into a customizable piece of wearable jewellery.",
    features: [
      "Necklace, bracelet, or pendant formats",
      "Personalization with initials, a date, or short message",
      "Wearable keepsake or gift use",
      "Optional neutral gift box",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "personalized-music-box",
    assignmentId: "adventure-2026-v2-p08",
    code: "P-08",
    title: "MelodyKeeps — Personalized Music Box",
    summary: "A traditional physical music box customizable with a short personal message.",
    description:
      "MelodyKeeps is a small traditional physical music box for people seeking a personalized keepsake. Its exterior can be customized with a name, date, or short meaningful message, while its lid, decorative construction, and music-box mechanism make it recognizable as a functioning music box. The combination of personalization and a traditional mechanical object distinguishes it from a generic keepsake box.",
    targetAudience: "People seeking a personalized physical keepsake or gift.",
    sellingProposition:
      "Combines a traditional music box with space for a name, date, or short personal message.",
    features: [
      "Functioning mechanical music-box mechanism",
      "Customizable name, date, or short message",
      "Decorative hinged lid",
      "Compact physical keepsake format",
    ],
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
];

// Keep assignments from the previous statement set readable. The active route aliases stay
// compatible with existing links and the published app; new database assignments use v2 keys.
export const LEGACY_PROBLEMS: ProblemStatement[] = [
  {
    id: "eco-shoes",
    code: "P-01",
    title: "Eco-Friendly Shoes",
    summary: "Sneakers that walk lighter on the planet.",
    description:
      "Launch 'Terra Step', a running shoe made from recycled ocean plastic and natural rubber, with a fully compostable insole. The brand wants to prove sustainable can also mean high-performance and stylish.",
    targetAudience: "Urban Gen-Z and young professionals, 18–30, fitness- and style-conscious.",
    sellingProposition:
      "Performance you feel, footprint you don't — every pair removes 12 plastic bottles from the ocean.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Music / Sound"],
    capacity: 20,
    archived: true,
    objective: "Drive pre-orders for the launch week.",
    duration: "30–60 seconds",
    constraints: [
      "No real brand logos or celebrities",
      "Must show the product in motion",
      "End with a clear call to action",
    ],
    angles: [
      "A day-in-the-life from sunrise run to night out",
      "Reverse journey: from the shoe back to the ocean",
      "Data-driven: footprint counter on screen",
    ],
  },
  {
    id: "rice-husk-cups",
    code: "P-02",
    title: "Rice Husk Coffee Cups",
    summary: "Your morning coffee, served by the harvest.",
    description:
      "Introduce 'HuskBrew', reusable coffee cups made from rice husk — an agricultural by-product usually burned. Durable, BPA-free, dishwasher-safe, and biodegradable at end of life.",
    targetAudience:
      "College students and café-goers, 18–35, who care about everyday sustainability.",
    sellingProposition: "Turns farm waste into your daily ritual — no plastic, no guilt.",
    toolCategories: ["Script & Copy", "Image Generation", "Voice / TTS", "Editing"],
    capacity: 20,
    archived: true,
    objective: "Build awareness and drive campus café partnerships.",
    duration: "30–45 seconds",
    constraints: ["Indian context encouraged", "No disparaging competitors"],
    angles: [
      "The farmer and the student — two worlds, one cup",
      "ASMR coffee pour with husk textures",
      "Before/after: smoke field vs. café table",
    ],
  },
  {
    id: "smart-bottle",
    code: "P-03",
    title: "Smart Sustainable Water Bottle",
    summary: "The bottle that reminds you to stay alive (and kind to Earth).",
    description:
      "Promote 'AquaPulse', a stainless-steel bottle with a glowing hydration reminder cap, UV self-cleaning, and a companion app that tracks plastic bottles saved.",
    targetAudience: "Students, coders and gym-goers, 16–30, who forget to drink water.",
    sellingProposition:
      "Hydration made smart — clean water, zero single-use plastic, gentle nudges.",
    toolCategories: ["Image Generation", "Video Generation", "Voice / TTS", "Music / Sound"],
    capacity: 20,
    archived: true,
    objective: "Drive app downloads and first-month sales.",
    duration: "30–60 seconds",
    constraints: [
      "Must show the glow reminder feature",
      "Keep claims realistic",
      "Include on-screen product name",
    ],
    angles: [
      "Hackathon all-nighter saved by a glowing cap",
      "Humour: the bottle as a personal coach",
      "Futuristic product-reveal spot",
    ],
  },
  {
    id: "solar-lantern",
    code: "P-04",
    title: "Sunrise Solar Lantern",
    summary: "Bring the sun home after dark.",
    description:
      "Introduce 'Ujala', a portable solar lantern designed for dependable light during power cuts, outdoor evenings and study sessions. It charges in daylight, has a USB backup port and is built for years of repairable use.",
    targetAudience:
      "Students, families and outdoor explorers who value reliable, lower-impact lighting.",
    sellingProposition:
      "One sunny day of charging, many brighter nights without disposable batteries.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Music / Sound"],
    capacity: 20,
    archived: true,
    objective: "Build trust in practical, everyday solar lighting.",
    duration: "30–45 seconds",
    constraints: [
      "Show the lantern charging and illuminating a real space",
      "Do not promise a specific runtime without substantiation",
      "Include the product name",
    ],
    angles: [
      "A neighbourhood power cut becomes a shared story",
      "Follow one ray of sun into a night-time study session",
      "A lantern passed between generations",
    ],
  },
  {
    id: "millet-snack",
    code: "P-05",
    title: "Millet Energy Bites",
    summary: "A little grain. A lot of get-up-and-go.",
    description:
      "Launch 'MileStart', a portable snack made with locally sourced millets, dates and seeds. It is designed for a quick break between lectures, practice and the commute home.",
    targetAudience:
      "Busy college students and young professionals looking for convenient snack options.",
    sellingProposition: "A satisfying, on-the-go bite rooted in familiar ingredients.",
    toolCategories: ["Script & Copy", "Image Generation", "Voice / TTS", "Music / Sound"],
    capacity: 20,
    archived: true,
    objective: "Make a locally inspired snack feel exciting to a new generation.",
    duration: "30–45 seconds",
    constraints: [
      "Do not make medical or unverified nutrition claims",
      "Keep the ingredients and packaging believable",
      "End with a memorable product reveal",
    ],
    angles: [
      "A fast-paced day pauses for one small reset",
      "A modern remix of a family snack ritual",
      "Millet grains become the beat of a campus day",
    ],
  },
  {
    id: "refill-cleaner",
    code: "P-06",
    title: "Refillable Home-Cleaning Concentrate",
    summary: "Big clean. Small bottle.",
    description:
      "Promote 'ClearDrop', a plant-derived cleaning concentrate supplied in compact refill sachets. Add water at home and reuse the same spray bottle, reducing bulky single-use packaging.",
    targetAudience: "First-time renters and households looking to simplify everyday cleaning.",
    sellingProposition: "A familiar clean with less packaging to carry, store and throw away.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
    archived: true,
    objective: "Encourage households to switch to a refill routine.",
    duration: "30–60 seconds",
    constraints: [
      "Follow the product’s label and dilution instructions",
      "Avoid implying the product is harmless or disinfecting without proof",
      "Show a reusable bottle",
    ],
    angles: [
      "A cupboard makeover from clutter to calm",
      "The journey of one bottle through many refills",
      "A tiny sachet takes the lead in a big clean",
    ],
  },
  {
    id: "recycled-backpack",
    code: "P-07",
    title: "Recycled-Fabric Everyday Backpack",
    summary: "Carry your day. Leave less behind.",
    description:
      "Introduce 'LoopPack', a durable everyday backpack made from recycled textile fibres, with repairable straps, thoughtful compartments and a simple take-back programme.",
    targetAudience:
      "Students and commuters who need a dependable bag for class, work and weekends.",
    sellingProposition: "Useful design, repairable details and a second life for recovered fabric.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
    archived: true,
    objective: "Position repairable design as a practical everyday choice.",
    duration: "30–60 seconds",
    constraints: [
      "Show realistic capacity and construction",
      "Avoid unverified recycled-content percentages",
      "Include a clear product name and call to action",
    ],
    angles: [
      "One backpack follows its owner from class to a weekend trip",
      "A frayed strap gets repaired instead of replaced",
      "Recovered fabric becomes a new campus essential",
    ],
  },
  {
    id: "laundry-sheets",
    code: "P-08",
    title: "Low-Waste Laundry Sheets",
    summary: "Laundry day, minus the bulky bottle.",
    description:
      "Launch 'WashFold', pre-measured laundry detergent sheets in recyclable paper packaging. Each lightweight sheet dissolves in the wash, making storage and travel simpler.",
    targetAudience: "Students in hostels, frequent travellers and small households.",
    sellingProposition: "A compact, pre-measured laundry routine with less packaging bulk.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Music / Sound"],
    capacity: 20,
    archived: true,
    objective: "Make a simpler laundry routine easy to understand at a glance.",
    duration: "30–45 seconds",
    constraints: [
      "Do not claim a specific environmental advantage without evidence",
      "Show correct use in a washing machine",
      "Avoid presenting the sheets as edible or child-safe",
    ],
    angles: [
      "A hostel shelf makeover",
      "Pack a whole laundry routine into a travel bag",
      "One sheet dissolves into a quick visual transition",
    ],
  },
  {
    id: "community-compost",
    code: "P-09",
    title: "Neighbourhood Compost Starter Kit",
    summary: "Turn kitchen scraps into tomorrow’s soil.",
    description:
      "Showcase 'BackToEarth', a compact home composting kit with a ventilated container, simple sorting guide and access to a local community garden network.",
    targetAudience:
      "Apartment residents, gardening beginners and environmentally curious families.",
    sellingProposition:
      "A guided, small-space first step toward returning food scraps to the soil.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Voice / TTS"],
    capacity: 20,
    archived: true,
    objective: "Help beginners feel confident taking their first composting step.",
    duration: "30–60 seconds",
    constraints: [
      "Represent composting realistically and hygienically",
      "Do not promise odour-free results",
      "Show how finished compost can be used",
    ],
    angles: [
      "A banana peel’s second life",
      "A balcony garden told from the soil’s point of view",
      "A small household habit grows into a community",
    ],
  },
];

export const getProblem = (id: string | null | undefined) =>
  PROBLEMS.find((p) => p.id === id || p.assignmentId === id) ??
  LEGACY_PROBLEMS.find((p) => p.id === id) ??
  null;

export const isLegacyProblem = (id: string | null | undefined) =>
  LEGACY_PROBLEMS.some((problem) => problem.id === id) &&
  !PROBLEMS.some((problem) => problem.id === id || problem.assignmentId === id);
