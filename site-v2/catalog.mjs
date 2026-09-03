export const site = {
  name: "Horizon Creations",
  origin: "https://horizoncreations.art",
  tagline: "Handmade leather goods built to get used.",
  description:
    "Handmade leather goods, custom work, and leatherworker tools built at the Horizon Creations bench in Northern California.",
  facebook: "https://www.facebook.com/pcmalone",
  facebookPage: "https://www.facebook.com/profile.php?id=61574262374190",
  instagram: "https://instagram.com/horizoncreations.art/",
  youtube: "https://www.youtube.com/@HorizonCreations-art",
  tiktok: "https://www.tiktok.com/@curtismalone82",
  cults3d: "https://cults3d.com/en/users/horizoncreations/3d-models",
};
export const imageDimensions = {
  "hero-journals": [1600, 759],
  "heresy-01": [747, 1600],
  "heresy-02": [1199, 1600],
  "heresy-03": [1203, 1600],
  "heresy-04": [1186, 1600],
  "pouch-hero": [1440, 1440],
  "pouch-detail": [1440, 1440],
  "sold-banzai": [747, 1600],
  "sold-turtles": [747, 1600],
  "sold-mushroom": [747, 1600],
  "custom-tree": [747, 1600],
  "custom-turtle": [1200, 1200],
  "custom-heresy": [1200, 1200],
  "custom-blue-scale": [1440, 1440],
  "process-bracelets": [919, 1600],
  "process-dye": [1600, 1600],
  "process-tools": [747, 1600],
  "process-cut": [1600, 747],
  "process-mark": [1600, 769],
  "process-detail": [747, 1600],
  "tools-stamps": [778, 1600],
};

export const products = [
  {
    slug: "heresy-journal",
    commerceId: "prd_horizon_heresy_journal",
    title: "Heresy Journal",
    state: "AVAILABLE",
    price: 75,
    priceLabel: "$75 shipped domestic",
    eyebrow: "One finished piece on the bench",
    summary:
      "Dark red hand-dyed leather, a bold stamped seal, rugged hardware, and a wrap closure made to take some wear.",
    detail:
      "Built for writers, gamers, sketchers, and anyone who wants a notebook that looks like it came out of a forbidden archive.",
    hero: "heresy-01",
    gallery: ["heresy-01", "heresy-02", "heresy-03", "heresy-04"],
    alt: "Dark red Heresy leather journal with stamped circular seal and black hardware",
  },
  {
    slug: "everyday-carry-pouch",
    commerceId: "prd_horizon_everyday_carry_pouch",
    title: "Everyday Carry Pouch",
    state: "MADE TO ORDER",
    price: 85,
    priceLabel: "Made to order from $85",
    eyebrow: "A repeatable bench pattern",
    summary:
      "A compact leather pouch for the small things that should not be loose in your pocket or bag.",
    detail:
      "The piece shown is the pattern reference. Leather, color, knotwork, and hardware can shift with the build.",
    hero: "pouch-hero",
    gallery: ["pouch-hero", "pouch-detail"],
    alt: "Dark brown everyday carry leather pouch with bright green Celtic knotwork",
  },
];

export const soldPieces = [
  {
    slug: "banzai-journal",
    title: "Banzai Journal",
    state: "SOLD",
    image: "sold-banzai",
    alt: "Golden brown leather journal with a hand-colored bonsai tree",
    summary: "Hand-dyed golden leather, carved bonsai, rustic paneling, and a wrap closure.",
  },
  {
    slug: "turtles-journal",
    title: "Turtles Journal",
    state: "SOLD",
    image: "sold-turtles",
    alt: "Blue hand-dyed leather journal with a carved sea turtle",
    summary: "Ocean-blue dye, sea turtle tooling, coastal stamps, and a wrap closure.",
  },
  {
    slug: "green-mushroom-journal",
    title: "Green Mushroom Journal",
    state: "SOLD",
    image: "sold-mushroom",
    alt: "Green leather journal with a colorful mushroom house and double straps",
    summary: "Bright forest color, mushroom-house tooling, a stamped border, and double straps.",
  },
];

export const customPieces = [
  {
    title: "Tree of Life Pair",
    image: "custom-tree",
    alt: "Pair of dark brown custom leather pieces with colored tree of life tooling",
    summary: "A matched pair with layered color, carved line work, and the tree motif carried through both pieces.",
  },
  {
    title: "Sea Turtle Cover",
    image: "custom-turtle",
    alt: "Blue custom leather journal cover with a large carved sea turtle",
    summary: "A one-off journal cover with turtle carving, coastal details, and deep blue finish work.",
  },
  {
    title: "Heresy Panel Run",
    image: "custom-heresy",
    alt: "Red and black custom leather panel work with stamped circular seal",
    summary: "Red-and-black panel work built around a bold seal, matching marks, and a dark finish direction.",
  },
  {
    title: "Blue Scale Finish Study",
    image: "custom-blue-scale",
    alt: "Close detail of blue scale-pattern tooling in finished leather",
    summary: "A color and texture study where the tooling, dye, and finish had to work together up close.",
  },
];

export const processSteps = [
  {
    number: "01",
    verb: "Raw hide",
    title: "Start with material that can change.",
    copy: "Leather carries grain, scars, stretch, and variation before I ever touch it. That is material, not a defect list.",
    image: "process-cut",
    alt: "Leather panels and journal pieces laid out on the workbench before assembly",
  },
  {
    number: "02",
    verb: "Cut",
    title: "Give the piece its working shape.",
    copy: "Patterns matter, but the actual piece still decides where edges, folds, and hardware want to land.",
    image: "process-tools",
    alt: "Leatherworking bench with hand tools, hardware, and pieces in progress",
  },
  {
    number: "03",
    verb: "Mark",
    title: "Press the idea into the leather.",
    copy: "Carving, stamping, printed tools, and test impressions all earn their place by making the finished work better.",
    image: "process-mark",
    alt: "Fresh leather tooling-block impressions lined up for inspection",
  },
  {
    number: "04",
    verb: "Dye",
    title: "Build color in passes, not shortcuts.",
    copy: "Dye changes with the hide, the tooling, and the finish. The useful part is knowing when to keep going and when to stop.",
    image: "process-dye",
    alt: "Leather dye bottles, brushes, and colored bracelet panels on the bench",
  },
  {
    number: "05",
    verb: "Stitch",
    title: "Turn worked pieces into something dependable.",
    copy: "Edges, hardware, stitching, closures, and fit are where an interesting surface becomes a piece you can actually use.",
    image: "process-detail",
    alt: "Close detail of carved and colored tree of life leatherwork",
  },
  {
    number: "06",
    verb: "Finish",
    title: "Let the bench work leave the bench.",
    copy: "The final piece is not supposed to stay perfect. It is supposed to pick up the marks of wherever you take it next.",
    image: "process-bracelets",
    alt: "Finished run of colorful hand-tooled leather bracelets",
  },
];

export const toolsLane = {
  title: "Tools for leatherworkers",
  image: "tools-stamps",
  alt: "Printed leather stamp blocks and their first test impressions",
  copy:
    "I also build and test FDM stamp tools, border panels, and odd little fixtures for leatherworkers who make things at their own benches.",
};
