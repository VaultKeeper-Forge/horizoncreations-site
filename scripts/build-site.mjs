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
        <span>Follow updates, check recent posts, and message directly about available or custom work.</span>
      </a>
      <a class="social-link" href="${site.instagram}" target="_blank" rel="noreferrer">
        <strong>Instagram</strong>
        <span>Best place for fresh photos, in-progress shots, and quick conversations about a build.</span>
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
        <p class="stat-note">Public Instagram profile count checked ${escapeHtml(site.stats.statsCheckedOn)}.</p>
      </article>
      <article class="stat-card">
        <div class="stat-label">Facebook Likes</div>
        <div class="stat-value">${escapeHtml(site.stats.facebookLikes)}</div>
        <p class="stat-note">Public Facebook page count visible right now.</p>
      </article>
      <article class="stat-card">
        <div class="stat-label">Talking About It</div>
        <div class="stat-value">${escapeHtml(site.stats.facebookTalking)}</div>
        <p class="stat-note">A useful live signal for current Facebook activity.</p>
      </article>
      <article class="stat-card">
        <div class="stat-label">Page Hits</div>
        <div class="stat-value stat-value-badge">
          <img class="stat-badge-image" src="${site.stats.pageHitsBadge}" alt="Live page hit counter for Horizon Creations">
        </div>
        <p class="stat-note">Live counter from a lightweight external badge service.</p>
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
            <p class="eyebrow">Leatherwork / Tools / Custom Builds</p>
            <h1>Built by hand for people who actually use their gear.</h1>
            <p>
              If you landed here from a tag, you are in the right place. Horizon Creations is the home
              base for handmade leatherwork, practical shop-built tools, and custom pieces shaped around
              real use instead of shelf display.
            </p>
            <p>
              Start with the gallery that fits what you want to see, or jump straight to Facebook or
              Instagram if you want to ask about a build.
            </p>
            <div class="button-row">
              <a class="button button-primary" href="${withBase("/#connect")}">Connect Fast</a>
              <a class="button button-secondary" href="${withBase("/custom-pieces/")}">See Custom Work</a>
            </div>
          </div>
          <aside class="hero-card">
            <div>
              <div class="hero-card-label">Current Focus</div>
              <strong>Strong contact links up front, live social proof, and a cleaner path into the work.</strong>
            </div>
            <p>
              If someone lands here from a tag, a post, or a custom piece in the real world, they should
              be able to reach out fast, see what is active, and keep moving without hunting through the page.
            </p>
            <img class="hero-preview" src="${customLead.images[0]}" alt="${escapeHtml(customLead.heroAlt)}">
          </aside>
        </div>
      </section>
      <section class="section" id="connect">
        <div class="section-card section-card-accent connect-spotlight">
          <div class="section-header">
            <h2>Connect And Follow The Work</h2>
            <p>Make the contact options obvious, keep the current reach visible, and let someone decide in seconds whether they want to message, follow, or keep browsing.</p>
          </div>
          <div class="connect-spotlight-grid">
            <div class="connect-spotlight-copy">
              <p class="lede">
                Instagram and Facebook are the fastest way into the conversation. If someone wants to ask about a custom build,
                check fresh progress photos, or see whether the bench is active, this is the lane.
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
            <h2>Browse the Work</h2>
            <p>
              The site now separates the main product-style pieces, one-off custom work, and the bench-side
              process shots so visitors can get where they want quickly.
            </p>
          </div>
          ${renderCategoryCards(sectionEntries)}
        </div>
      </section>
      <section class="section">
        <div class="section-card">
          <div class="section-header">
            <h2>Selected From the Bench</h2>
            <p>
              A small cross-section of current work and process, pulled from the same content folders that drive the gallery pages.
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
            <h2>How It Works</h2>
            <p>Keeping the process simple makes it easier to start a conversation and figure out whether a build makes sense.</p>
          </div>
          <div class="process-layout">
            <div class="process-step">
              <span>Step 1</span>
              <h3>See the style</h3>
              <p>Look through Standard Pieces, Custom Pieces, or Workbench to get a feel for materials, finish, and the kind of work coming off the bench.</p>
            </div>
            <div class="process-step">
              <span>Step 2</span>
              <h3>Send the idea</h3>
              <p>Message on Instagram or Facebook with what you need, what it should do, and anything you want it to fit or match.</p>
            </div>
            <div class="process-step">
              <span>Step 3</span>
              <h3>Build from there</h3>
              <p>From quick makes to one-off commissions, the next step is figuring out the right format instead of forcing every project into a store listing.</p>
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
