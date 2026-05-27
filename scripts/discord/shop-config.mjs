export const shopConfig = {
  brandName: "Horizon Creations",
  serverName: "Horizon Creations Shop",
  botName: "Rivet",
  description:
    "The public Horizon Creations shop server: leatherwork, 3D printing, handmade projects, tools, repairs, experiments, and craft talk. All crafts are welcome.",
  links: {
    website: process.env.SHOP_WEBSITE_URL || "https://horizoncreations.art",
    facebook:
      process.env.SHOP_FACEBOOK_URL ||
      "https://www.facebook.com/profile.php?id=61574262374190",
    instagram:
      process.env.SHOP_INSTAGRAM_URL ||
      "https://instagram.com/horizoncreations.art/",
    discordInvite: process.env.SHOP_DISCORD_INVITE_URL || "",
  },
  roles: [
    { name: "Shop Crew", color: 0xd98b3a, hoist: true },
    { name: "Shop Regular", color: 0xb9854f },
    { name: "Customer", color: 0xc8a76a },
    { name: "Maker", color: 0x9b6b43 },
    { name: "Craft Talk", color: 0xc48a44 },
    { name: "Leather Art", color: 0x8b4f2f },
    { name: "3D Printing", color: 0x2f80ed },
    { name: "Digital Tools", color: 0x7c5cff },
    { name: "Workbench", color: 0x68717a },
    { name: "Announcements", color: 0xf2c18d },
    { name: "Drops", color: 0xe0a340 },
    { name: "Custom Orders", color: 0x35a267 },
    { name: "Live Shop", color: 0x2ecc71 },
    { name: "Beta Tester", color: 0x5dade2 },
  ],
  legacyRoleRenames: [
    { from: "AI Lab", to: "Digital Tools" },
  ],
  selfAssignableRoles: [
    {
      name: "Craft Talk",
      label: "Craft Talk",
      description: "General crafting, making, repairs, tools, materials, and process.",
    },
    {
      name: "Leather Art",
      label: "Leather Art",
      description: "Leatherwork, tooling, dye, and finished piece talk.",
    },
    {
      name: "3D Printing",
      label: "3D Printing",
      description: "Printer, slicer, filament, fixtures, and machine-view talk.",
    },
    {
      name: "Digital Tools",
      label: "Digital Tools",
      description: "Design software, automation, AI helpers, files, and shop tech.",
    },
    {
      name: "Workbench",
      label: "Workbench",
      description: "Bench updates, process shots, experiments, and shop notes.",
    },
    {
      name: "Announcements",
      label: "Announcements",
      description: "Major shop updates and important notices.",
    },
    {
      name: "Drops",
      label: "Drops",
      description: "New pieces, product drops, and availability alerts.",
    },
    {
      name: "Custom Orders",
      label: "Custom Orders",
      description: "Commission openings, order info, and custom-work notices.",
    },
    {
      name: "Live Shop",
      label: "Live Shop",
      description: "Live bench, machine-view, stream, and event pings.",
    },
  ],
  rules: [
    "Respect the shop and the people in it. Keep feedback useful, direct, and civil.",
    "All crafts are welcome. Leather, printing, wood, paint, models, repairs, digital design, tools, experiments, and beginner questions all belong here.",
    "No spam, scams, random invites, self-promo dumps, or bot noise.",
    "Keep private work private. Do not repost customer details, backstage notes, screenshots, or unfinished planning without permission.",
    "Use the right channel. Orders go in custom-orders or support, finished work goes in showcase, printer talk goes in 3d-printing, and general craft talk goes in general-off-topic.",
    "No hateful, harassing, explicit, or unsafe content. Keep the server suitable for customers and collaborators.",
    "Do not treat estimates, ideas, or rough planning as final quotes until VaultKeeper confirms them.",
    "Rivet can help route things, but staff decisions come from the owner or Shop Crew.",
  ],
  channelPlan: [
    {
      category: "Welcome",
      channels: [
        { name: "welcome", topic: "Start here. Say hi, pick roles, and see what the Horizon Creations Shop is about." },
        { name: "announcements", topic: "Official Horizon Creations updates, drops, live notices, events, and website news." },
        { name: "rules-and-info", topic: "Rules, role picker, and join info for the Horizon Creations Shop." },
      ],
    },
    {
      category: "Shop Floor",
      channels: [
        { name: "general-off-topic", topic: "General craft talk, shop chat, questions, repairs, materials, tools, and community conversation." },
        { name: "leather-art", topic: "Leatherwork, tooling, dyes, finishing, patterns, and finished pieces." },
        { name: "3d-printing", topic: "Printer talk, slicer settings, filament, forms, fixtures, machine troubleshooting, and print projects." },
        { name: "showcase", topic: "Finished work, progress shots, customer pieces, and community makes from any craft." },
      ],
    },
    {
      category: "Orders And Support",
      channels: [
        { name: "custom-orders", topic: "Start here for custom leather, handmade pieces, printed parts, shop builds, and rough quote questions." },
        { name: "support", topic: "Order help, fit questions, shop questions, and anything that may need a private ticket." },
      ],
    },
    {
      category: "Backstage",
      channels: [
        { name: "back-stage", topic: "Private shop planning, operations, sensitive notes, and admin work." },
        { name: "codex-ops", topic: "Private VaultKeeper and Rivet operations lane for PC, site, Discord, and shop-control requests.", ownerOnly: true },
        { name: "ai-chat", topic: "Private Rivet, Codex, automation, and digital workflow notes." },
        { name: "forge-mesh", topic: "Private build systems, integrations, shop tech, and deeper experiments." },
        { name: "plod-research-channel", topic: "Research notes, experiments, references, source links, and raw ideas." },
      ],
      private: true,
    },
  ],
};
