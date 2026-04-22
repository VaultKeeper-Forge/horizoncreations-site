import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const contentDir = path.join(rootDir, "content");
const outputDir = rootDir;
const siteBasePath = normalizeBasePath(process.env.SITE_BASE_PATH || "");
const inlineSiteCss = await readFile(path.join(rootDir, "assets", "site.css"), "utf8");

const site = {
  name: "Horizon Creations",
  description:
    "Horizon Creations builds leatherwork, practical tools, and one-off handmade projects.",
  instagram: "https://instagram.com/horizoncreations.art/",
  facebook: "https://www.facebook.com/profile.php?id=61574262374190",
  logo: "/HorizonCreaion-Base-logo.jpg",
  footer: "Handmade projects from Horizon Creations.",
  stats: {
    instagramFollowers: "1,529",
    facebookLikes: "65",
    facebookTalking: "156",
    statsCheckedOn: "April 21, 2026",
    pageHitsBadge: "https://visitor-badge.laobi.icu/badge?page_id=horizoncreations.art.home",
  },
};

const sections = [
  {
    slug: "standard-pieces",
    label: "Standard Pieces",
    eyebrow: "Core work / repeatable builds",
    title: "Standard Pieces",
    navLabel: "Standard Pieces",
    summary:
      "Repeatable product-style work, dependable formats, and pieces that show the main line of what Horizon Creations builds.",
  },
  {
    slug: "custom-pieces",
    label: "Custom Pieces",
    eyebrow: "One-off builds / commissions",
    title: "Custom Pieces",
    navLabel: "Custom Pieces",
    summary:
      "Custom builds, one-off experiments, and commissions shaped around a specific need instead of a fixed catalog.",
  },
  {
    slug: "workbench",
    label: "Workbench",
    eyebrow: "Process / tools / shop",
    title: "Workbench",
    navLabel: "Workbench",
    summary:
      "Behind-the-scenes views of molds, forms, tooling, prototypes, and the practical side of how the work gets made.",
  },
];

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function normalizeBasePath(value) {
  if (!value || value === "/") {
    return "";
  }

  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

function withBase(urlPath) {
  if (!urlPath.startsWith("/")) {
    return urlPath;
  }

  return `${siteBasePath}${urlPath}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slugToTitle(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const aOrder = Number.isFinite(a.sortOrder) ? a.sortOrder : Number.MAX_SAFE_INTEGER;
    const bOrder = Number.isFinite(b.sortOrder) ? b.sortOrder : Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    const aDate = a.date ? Date.parse(`${a.date}T12:00:00`) : 0;
    const bDate = b.date ? Date.parse(`${b.date}T12:00:00`) : 0;

    if (aDate !== bDate) {
      return bDate - aDate;
    }

    return a.title.localeCompare(b.title);
  });
}

async function readEntry(section) {
  const sectionDir = path.join(contentDir, section.slug);
  const dirEntries = await readdir(sectionDir, { withFileTypes: true });
  const folders = dirEntries.filter((entry) => entry.isDirectory());
  const entries = [];

  for (const folder of folders) {
    const entryDir = path.join(sectionDir, folder.name);
    const entryPath = path.join(entryDir, "entry.json");
    const raw = await readFile(entryPath, "utf8");
    const data = JSON.parse(raw);
    const files = await readdir(entryDir, { withFileTypes: true });
    const imageFiles = files
      .filter((file) => file.isFile() && imageExtensions.has(path.extname(file.name).toLowerCase()))
      .map((file) => file.name)
      .sort();

    if (!data.title || !data.caption) {
      throw new Error(`Entry ${entryPath} must include title and caption.`);
    }

    if (!imageFiles.length) {
      throw new Error(`Entry ${entryPath} must include at least one image file.`);
    }

    const featuredImage = data.featuredImage && imageFiles.includes(data.featuredImage)
      ? data.featuredImage
      : imageFiles[0];

    const orderedImages = [
      featuredImage,
      ...imageFiles.filter((fileName) => fileName !== featuredImage),
    ];

    entries.push({
      slug: folder.name,
      title: data.title,
      caption: data.caption,
      description: data.description || data.caption,
      tags: Array.isArray(data.tags) ? data.tags : [],
      date: data.date || "",
      featured: Boolean(data.featured),
      sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : undefined,
      heroAlt: data.heroAlt || `${data.title} by Horizon Creations`,
      section,
      images: orderedImages.map(
        (fileName) => withBase(`/content/${section.slug}/${folder.name}/${fileName}`),
      ),
    });
  }

  return sortEntries(entries);
}

function renderNav(currentPath) {
  const navItems = [
    { href: "/", label: "Home" },
    ...sections.map((section) => ({
      href: `/${section.slug}/`,
      label: section.navLabel,
    })),
    { href: "/#connect", label: "Connect" },
  ];

  return `
    <nav class="nav" aria-label="Primary">
      <a class="brand" href="${withBase("/")}">
        <span class="brand-mark" aria-hidden="true"></span>
        ${escapeHtml(site.name)}
      </a>
      <div class="nav-links">
        ${navItems
          .map((item) => {
            const isCurrent =
              item.href === currentPath ||
              (item.href !== "/" && item.href !== "/#connect" && currentPath.startsWith(item.href));
            const currentAttr = isCurrent ? ' aria-current="page"' : "";
            return `<a href="${withBase(item.href)}"${currentAttr}>${escapeHtml(item.label)}</a>`;
          })
          .join("")}
      </div>
    </nav>
  `;
}

function renderLayout({ title, description, currentPath, bodyClass = "", body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="icon" type="image/jpeg" href="${withBase(site.logo)}">
<link rel="stylesheet" href="${withBase("/assets/site.css")}">
<style>
${inlineSiteCss}
</style>
</head>
<body class="${bodyClass}">
  <div class="page-shell">
    <main class="site-frame">
      ${body}
      <div class="footer">${escapeHtml(site.footer)}</div>
    </main>
  </div>
</body>
</html>
`;
}

function renderSocialLinks({ spotlight = false } = {}) {
  const gridClass = spotlight ? "social-grid social-grid-spotlight" : "social-grid";

  return `
    <div class="${gridClass}">
      <a class="social-link" href="${site.facebook}" target="_blank" rel="noreferrer">
        <strong>Facebook</strong>
        <span>Fresh posts, current work, and the easiest place to message me about something you want made.</span>
      </a>
      <a class="social-link" href="${site.instagram}" target="_blank" rel="noreferrer">
        <strong>Instagram</strong>
        <span>Bench photos, in-progress shots, and the weird stuff that shows up before it lands on the site.</span>
      </a>
    </div>
  `;
}

function renderStatsGrid() {
  return `
    <div class="stats-grid" aria-label="Current site and social stats">
      <article class="stat-card">
        <div class="stat-label">Instagram Followers</div>
        <div class="stat-value">${escapeHtml(site.stats.instagramFollowers)}</div>
        <p class="stat-note">What Instagram was showing publicly on ${escapeHtml(site.stats.statsCheckedOn)}.</p>
      </article>
      <article class="stat-card">
        <div class="stat-label">Facebook Likes</div>
        <div class="stat-value">${escapeHtml(site.stats.facebookLikes)}</div>
        <p class="stat-note">Current public page likes on Facebook.</p>
      </article>
      <article class="stat-card">
        <div class="stat-label">Talking About It</div>
        <div class="stat-value">${escapeHtml(site.stats.facebookTalking)}</div>
        <p class="stat-note">A quick read on whether the page is moving around right now.</p>
      </article>
      <article class="stat-card">
        <div class="stat-label">Page Hits</div>
        <div class="stat-value stat-value-badge">
          <img class="stat-badge-image" src="${site.stats.pageHitsBadge}" alt="Live page hit counter for Horizon Creations">
        </div>
        <p class="stat-note">Rough live traffic count for this page.</p>
      </article>
    </div>
  `;
}

function renderCategoryCards(sectionEntries) {
  return `
    <div class="category-grid">
      ${sections
        .map((section) => {
          const heroEntry = sectionEntries[section.slug][0];
          return `
            <a class="category-link" href="${withBase(`/${section.slug}/`)}">
              <img src="${heroEntry.images[0]}" alt="${escapeHtml(heroEntry.heroAlt)}">
              <div>
                <span>${escapeHtml(section.eyebrow)}</span>
                <h3>${escapeHtml(section.label)}</h3>
                <p>${escapeHtml(section.summary)}</p>
              </div>
            </a>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderEntryCard(entry) {
  const thumbImages = entry.images.slice(1, 4);
  const dateHtml = entry.date
    ? `<div class="entry-date">${escapeHtml(formatDate(entry.date))}</div>`
    : "";
  const tagsHtml = entry.tags.length
    ? `<div class="tag-row">${entry.tags
        .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join("")}</div>`
    : "";
  const thumbStrip = thumbImages.length
    ? `<div class="thumb-strip">${thumbImages
        .map(
          (imageUrl, index) =>
            `<img src="${imageUrl}" alt="${escapeHtml(`${entry.title} detail ${index + 1}`)}">`,
        )
        .join("")}</div>`
    : "";

  return `
    <article class="entry-card">
      <div class="entry-hero-wrap">
        <img class="entry-hero" src="${entry.images[0]}" alt="${escapeHtml(entry.heroAlt)}">
        ${thumbStrip}
      </div>
      <div class="entry-copy">
        <div class="badge-row">
          <span class="badge">${escapeHtml(entry.section.label)}</span>
          <span class="stat-chip">${entry.images.length} photo${entry.images.length === 1 ? "" : "s"}</span>
        </div>
        <div class="entry-header">
          <h2>${escapeHtml(entry.title)}</h2>
          ${dateHtml}
        </div>
        <p>${escapeHtml(entry.caption)}</p>
        <p>${escapeHtml(entry.description)}</p>
        ${tagsHtml}
      </div>
    </article>
  `;
}

function renderGalleryPage(section, entries) {
  const introEntry = entries[0];

  return renderLayout({
    title: `${section.title} | ${site.name}`,
    description: section.summary,
    currentPath: `/${section.slug}/`,
    body: `
      <section class="page-hero">
        ${renderNav(`/${section.slug}/`)}
        <div class="page-hero-grid">
          <div class="page-hero-copy">
            <p class="eyebrow">${escapeHtml(section.eyebrow)}</p>
            <h1>${escapeHtml(section.title)}</h1>
            <p>${escapeHtml(section.summary)}</p>
            <div class="button-row">
              <a class="button button-primary" href="${withBase("/#connect")}">Connect</a>
              <a class="button button-secondary" href="${withBase("/")}">Back Home</a>
            </div>
          </div>
          <aside class="gallery-callout">
            <div>
              <div class="callout-label">What You Will Find Here</div>
              <strong>${escapeHtml(introEntry.title)}</strong>
            </div>
            <p>${escapeHtml(introEntry.caption)}</p>
            <img class="callout-preview" src="${introEntry.images[0]}" alt="${escapeHtml(introEntry.heroAlt)}">
          </aside>
        </div>
      </section>
      <section class="section">
        <div class="section-card">
          <div class="section-header">
            <h2>${escapeHtml(section.title)} Gallery</h2>
            <p>
              These entries are grouped so you can keep adding new work without touching the layout.
              Drop photos into the right content folder, add the entry metadata, and rebuild.
            </p>
          </div>
          <div class="entry-grid">
            ${entries.map((entry) => renderEntryCard(entry)).join("")}
          </div>
        </div>
      </section>
      <section class="section" id="connect">
        <div class="section-card section-card-accent">
          <div class="section-header">
            <h2>Connect</h2>
            <p>Questions about a similar piece, a custom order, or what is currently available are easiest to start on social.</p>
          </div>
          ${renderSocialLinks()}
        </div>
      </section>
    `,
  });
}

function renderHomePage(sectionEntries) {
  const customLead = sectionEntries["custom-pieces"].find((entry) => entry.featured) || sectionEntries["custom-pieces"][0];
  const featuredEntries = sections
    .flatMap((section) => {
      const featured = sectionEntries[section.slug].find((entry) => entry.featured);
      return featured ? [featured] : sectionEntries[section.slug].slice(0, 1);
    })
    .slice(0, 3);

  return renderLayout({
    title: site.name,
    description: site.description,
    currentPath: "/",
    body: `
      <section class="hero">
        ${renderNav("/")}
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">Leather / tools / custom work / shop mess</p>
            <h1>Handmade leather goods with some grit on them.</h1>
            <p>
              This is the home base for Horizon Creations. I am a guy at the bench smashing stamps,
              pounding rivets, slinging dye, and trying to make things that feel solid in the hand instead
              of factory-flat.
            </p>
            <p>
              Some of it is clean everyday carry stuff. Some of it gets a little strange. If it looks like
              something you would actually carry, wear, beat up, or hand to somebody and say "yeah, that
              one is mine," you are in the right place.
            </p>
            <div class="button-row">
              <a class="button button-primary" href="${withBase("/#connect")}">Message Me</a>
              <a class="button button-secondary" href="${withBase("/custom-pieces/")}">See The Work</a>
            </div>
          </div>
          <aside class="hero-card">
            <div>
              <div class="hero-card-label">Bench Right Now</div>
              <strong>Leather goods, custom pieces, and whatever else survives getting dragged across the bench.</strong>
            </div>
            <p>
              The point of this page is simple: show the work, make it easy to reach me, and keep the whole
              thing feeling like an actual shop instead of a fake polished storefront.
            </p>
            <img class="hero-preview" src="${customLead.images[0]}" alt="${escapeHtml(customLead.heroAlt)}">
          </aside>
        </div>
      </section>
      <section class="section" id="connect">
        <div class="section-card section-card-accent connect-spotlight">
          <div class="section-header">
            <h2>Find Me Here</h2>
            <p>If you want to ask about a build, watch new work show up, or just keep an eye on what is coming off the bench, this is where to do it.</p>
          </div>
          <div class="connect-spotlight-grid">
            <div class="connect-spotlight-copy">
              <p class="lede">
                Facebook and Instagram are the fast lane. That is where the fresh stuff goes first, where progress shots land,
                and where it is easiest to say "hey, can you make something like this?"
              </p>
              ${renderSocialLinks({ spotlight: true })}
            </div>
            ${renderStatsGrid()}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-card">
          <div class="section-header">
            <h2>What Is On The Bench</h2>
            <p>
              The site is split up so you can go straight to the kind of stuff you actually want to see:
              standard pieces, one-off customs, or the rough in-progress bench side of it.
            </p>
          </div>
          ${renderCategoryCards(sectionEntries)}
        </div>
      </section>
      <section class="section">
        <div class="section-card">
          <div class="section-header">
            <h2>Recent Pieces</h2>
            <p>
              A few pieces pulled straight from the same folders that run the rest of the site. Nothing fancy, just the current work.
            </p>
          </div>
          <div class="entry-grid">
            ${featuredEntries.map((entry) => renderEntryCard(entry)).join("")}
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-card">
          <div class="section-header">
            <h2>How A Build Usually Goes</h2>
            <p>Nothing complicated here. You reach out, we talk through it, and then I figure out whether it wants to be a standard piece, a custom, or something a little weirder.</p>
          </div>
          <div class="process-layout">
            <div class="process-step">
              <span>Step 1</span>
              <h3>Look around first</h3>
              <p>Check the galleries so you can see the kind of leather, finish, color, and general feel I tend to work in.</p>
            </div>
            <div class="process-step">
              <span>Step 2</span>
              <h3>Send me the idea</h3>
              <p>Message me with what you need, what it should fit, what it should do, or even just a rough half-baked idea.</p>
            </div>
            <div class="process-step">
              <span>Step 3</span>
              <h3>We figure it out from there</h3>
              <p>Sometimes it is a straightforward make. Sometimes it turns into a custom job. Sometimes it needs a little shop chaos first.</p>
            </div>
          </div>
        </div>
      </section>
    `,
  });
}

async function ensureDirectory(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function writePage(relativeDir, fileName, html) {
  const targetDir = path.join(outputDir, relativeDir);
  await ensureDirectory(targetDir);
  await writeFile(path.join(targetDir, fileName), html, "utf8");
}

async function buildSite() {
  const sectionEntries = {};

  for (const section of sections) {
    const entries = await readEntry(section);

    if (!entries.length) {
      throw new Error(`Section ${section.slug} must include at least one entry.`);
    }

    sectionEntries[section.slug] = entries;
  }

  await writePage(".", "index.html", renderHomePage(sectionEntries));

  for (const section of sections) {
    const html = renderGalleryPage(section, sectionEntries[section.slug]);
    await writePage(section.slug, "index.html", html);
  }
}

buildSite().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
