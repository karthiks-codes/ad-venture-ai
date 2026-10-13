// STATIC problem statement configuration — the single source of truth.
// Only the team→problem mapping is stored in the database. `capacity` caps how many teams may draw it.
export type ProblemStatement = {
  id: string;
  code: string;
  title: string;
  summary: string;
  description: string;
  targetAudience: string;
  sellingProposition: string;
  visualReference: string;
  toolCategories: string[];
  capacity: number;
};

export const PROBLEMS: ProblemStatement[] = [
  {
    id: "rice-husk-cups",
    code: "P-01",
    title: "HuskCup — Sustainable Rice-Husk Cup",
    summary: "A practical reusable or disposable cup made partly from rice husk.",
    description:
      "HuskCup is a cup made from rice husk and other suitable materials, offering a practical alternative to conventional drinkware. It makes productive use of rice husk, an agricultural by-product that may otherwise go unused. The product can be designed for reuse or single use, with material performance and end-of-life claims based on its actual specification.",
    targetAudience: "People seeking practical drinkware and more considered material choices.",
    sellingProposition:
      "Useful everyday drinkware that makes productive use of rice-processing by-products.",
    visualReference:
      "Show one unbranded cup clearly against a clean background, with its shape and rice-husk-composite texture visible.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "recycled-backpack",
    code: "P-02",
    title: "VoltPack — Solar Charging Backpack",
    summary: "An urban commuter backpack with storage and solar-assisted charging.",
    description:
      "VoltPack is a practical urban backpack for commuters carrying daily essentials and devices away from a power outlet. It has multiple storage compartments, a dedicated laptop compartment, USB charging ports connected to a power bank, and an integrated solar panel that provides supplemental charging. Its distinguishing feature is the combination of organized commuter storage and solar-assisted device charging in one bag.",
    targetAudience: "Urban commuters and students carrying a laptop and mobile devices.",
    sellingProposition:
      "Combines organized everyday carry with supplemental solar charging in one commuter backpack.",
    visualReference:
      "Show an unbranded, practical multi-compartment commuter backpack, clearly representing the laptop compartment, solar panel, power bank connection, and USB ports.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "smart-bottle",
    code: "P-03",
    title: "HydroHalo — Sustainable Smart Water Bottle",
    summary: "A reusable stainless-steel bottle with hydration reminders and a temperature display.",
    description:
      "HydroHalo is a reusable stainless-steel water bottle for people who want durable drinkware and a simple way to remember to hydrate. It features hydration reminders and an at-a-glance temperature display, with a companion application available as an optional extension. The durable metal construction and built-in prompts distinguish it from ordinary reusable bottles without relying on unsupported health claims.",
    targetAudience: "People who want durable reusable drinkware and hydration reminders.",
    sellingProposition:
      "Pairs a reusable metal bottle with simple hydration prompts and at-a-glance temperature information.",
    visualReference:
      "Show an unbranded stainless-steel bottle with a clean contemporary silhouette and a clearly visible temperature display; do not depict disposable plastic.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "personal-safety-device",
    code: "P-04",
    title: "SafeSignal — Personal Safety Device",
    summary: "A compact wearable or keychain device for requesting attention in an emergency.",
    description:
      "SafeSignal is a compact wearable or keychain device for people who want an accessible way to alert others in an emergency. Its physical controls include a loud emergency alarm and an SOS button, with smartphone-connected location sharing as an optional feature. Portability and direct access to the alarm controls are central to its usefulness.",
    targetAudience: "People looking for a compact, accessible personal safety alert.",
    sellingProposition:
      "Combines a physical alarm and SOS control in a portable device, with optional connected location sharing.",
    visualReference:
      "Show a small unbranded physical device with a visible alarm or SOS control and a keyring, clip, or wearable attachment to communicate how it is carried.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "protein-bar",
    code: "P-05",
    title: "BloomBite — Protein Bar",
    summary: "A convenient snack bar made with familiar ingredients and plant-based protein.",
    description:
      "BloomBite is an individually packaged protein bar for people who need a convenient snack during a busy day. Its recipe can use familiar ingredients such as dates, oats, nuts, and plant-based protein, giving the bar a recognizable texture and ingredient profile. The product is positioned as a practical portable snack, without relying on unsupported nutritional or health claims.",
    targetAudience: "People looking for a convenient snack during busy days.",
    sellingProposition:
      "A portable bar combining plant-based protein with familiar ingredients in a convenient individual serving.",
    visualReference:
      "Show a single unbranded snack bar with its texture visible beside simple, generic individual packaging.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "eco-shoes",
    code: "P-06",
    title: "Evertrail — Sustainable Sneakers",
    summary: "Contemporary everyday sneakers made partly from recycled materials.",
    description:
      "Evertrail is a contemporary everyday sneaker for people looking for practical comfort and modern styling. It uses recycled materials in part, combining considered material choices with a familiar wearable silhouette. The product's distinction is this mix of everyday function and partial use of recycled materials; no specific recycled-content percentage is assumed.",
    targetAudience: "People seeking comfortable everyday footwear with considered material choices.",
    sellingProposition:
      "Combines a contemporary everyday silhouette and practical comfort with partial use of recycled materials.",
    visualReference:
      "Show a complete unbranded pair of contemporary sneakers, clearly revealing the upper material, sole, and overall silhouette.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "personalized-jewelry",
    code: "P-07",
    title: "Dearly — Personalized Keepsake Jewellery",
    summary: "Customizable physical jewellery featuring a short personal detail.",
    description:
      "Dearly is a customizable piece of physical jewellery for people seeking a wearable personal keepsake or gift. Necklaces, bracelets, or pendants can be personalized with initials, a date, or a short message, with a neutral gift box as an optional presentation. Its differentiator is the ability to make a simple piece personal through a chosen detail.",
    targetAudience: "People looking for customizable jewellery as a personal keepsake or gift.",
    sellingProposition:
      "Turns a short personal detail into a customizable piece of wearable jewellery.",
    visualReference:
      "Show unbranded physical jewellery, such as a necklace, bracelet, or pendant, with optional neutral gift packaging and generic personalization.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
  {
    id: "personalized-music-box",
    code: "P-08",
    title: "MelodyKeeps — Personalized Music Box",
    summary: "A traditional physical music box customizable with a short personal message.",
    description:
      "MelodyKeeps is a small traditional physical music box for people seeking a personalized keepsake. Its exterior can be customized with a name, date, or short meaningful message, while its lid, decorative construction, and music-box mechanism make it recognizable as a functioning music box. The combination of personalization and a traditional mechanical object distinguishes it from a generic keepsake box.",
    targetAudience: "People seeking a personalized physical keepsake or gift.",
    sellingProposition:
      "Combines a traditional music box with space for a name, date, or short personal message.",
    visualReference:
      "Show an actual unbranded small music box with its lid and decorative construction visible; include the winding mechanism if possible. A generic keepsake box alone is not a suitable reference.",
    toolCategories: ["Script & Copy", "Image Generation", "Video Generation", "Editing"],
    capacity: 20,
  },
];

export const getProblem = (id: string | null | undefined) =>
  PROBLEMS.find((p) => p.id === id) ?? null;
