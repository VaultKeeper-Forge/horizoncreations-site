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
    "Handmade leather goods, custom work, bench-built tools, and the rough shop side of Horizon Creations.",
  instagram: "https://instagram.com/horizoncreations.art/",
  facebook: "https://www.facebook.com/profile.php?id=61574262374190",
  logo: "/HorizonCreaion-Base-logo.jpg",
  footer: "Horizon Creations. Handmade leather goods, custom work, and shop-built nonsense.",
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
      "Regular builds. Pouches, straps, sheaths, and other pieces I can make again without pretending every one of them is a rare artifact.",
  },
  {
    slug: "custom-pieces",
    label: "Custom Pieces",
    eyebrow: "One-off builds / commissions",
    title: "Custom Pieces",
    navLabel: "Custom Pieces",
    summary:
      "One-offs, commissions, odd requests, and the jobs that do not fit neatly into a product listing.",
  },
  {
    slug: "workbench",
    label: "Workbench",
    eyebrow: "Process / tools / shop",
    title: "Workbench",
    navLabel: "Workbench",
    summary:
      "The shop side of it. Tools, forms, scraps, half-finished pieces, and the mess that gets the work done.",
  },
];

const infoPages = [
  { href: "/about/", label: "About" },
  { href: "/custom-orders/", label: "Custom Orders" },
  { href: "/contact/", label: "Contact" },
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
    ...infoPages,
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

function renderPageHero({ currentPath, eyebrow, title, copy, primaryCta, secondaryCta, calloutLabel, calloutTitle, calloutCopy, imageUrl, imageAlt }) {
  return `
    <section class="page-hero">
      ${renderNav(currentPath)}
      <div class="page-hero-grid">
        <div class="page-hero-copy">
          <p class="eyebrow">${escapeHtml(eyebrow)}</p>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(copy)}</p>
          <div class="button-row">
            <a class="button button-primary" href="${primaryCta.href}">${escapeHtml(primaryCta.label)}</a>
            <a class="button button-secondary" href="${secondaryCta.href}">${escapeHtml(secondaryCta.label)}</a>
          </div>
        </div>
        <aside class="gallery-callout">
          <div>
            <div class="callout-label">${escapeHtml(calloutLabel)}</div>
            <strong>${escapeHtml(calloutTitle)}</strong>
          </div>
          <p>${escapeHtml(calloutCopy)}</p>
          <img class="callout-preview" src="${imageUrl}" alt="${escapeHtml(imageAlt)}">
        </aside>
      </div>
    </section>
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
      ${renderPageHero({
        currentPath: `/${section.slug}/`,
        eyebrow: section.eyebrow,
        title: section.title,
        copy: section.summary,
        primaryCta: { href: withBase("/contact/"), label: "Get In Touch" },
        secondaryCta: { href: withBase("/"), label: "Back Home" },
        calloutLabel: "First One Up",
        calloutTitle: introEntry.title,
        calloutCopy: introEntry.caption,
        imageUrl: introEntry.images[0],
        imageAlt: introEntry.heroAlt,
      })}
      <section class="section">
        <div class="section-card">
          <div class="section-header">
            <h2>${escapeHtml(section.title)}</h2>
            <p>
              This is the running pile for ${escapeHtml(section.label.toLowerCase())}. Some of it is cleaner,
              some of it is rougher, but it all belongs here for a reason.
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
            <h2>Want Something Like This?</h2>
            <p>The fastest way to ask about a similar piece, a custom order, or what is ready now is still a direct message.</p>
          </div>
          ${renderSocialLinks()}
        </div>
      </section>
    `,
  });
}

function renderAboutPage(sectionEntries) {
  const customLead = sectionEntries["custom-pieces"][0];

  return renderLayout({
    title: `About | ${site.name}`,
    description: "Who is behind the bench and what Horizon Creations is actually about.",
    currentPath: "/about/",
    body: `
      ${renderPageHero({
        currentPath: "/about/",
        eyebrow: "who is behind the bench",
        title: "About Horizon Creations",
        copy: "This is not a giant brand operation. It is one guy at the bench making leather goods, custom pieces, and whatever tools or fixtures need to exist so the work can get done right.",
        primaryCta: { href: withBase("/contact/"), label: "Reach Out" },
        secondaryCta: { href: withBase("/custom-pieces/"), label: "See Custom Work" },
        calloutLabel: "Short Version",
        calloutTitle: "Smashing stamps. Pounding rivets. Slinging dye.",
        calloutCopy: "That Facebook header line is pretty close to the truth. The work starts at the bench and usually stays a little rough around the edges in the best possible way.",
        imageUrl: customLead.images[0],
        imageAlt: customLead.heroAlt,
      })}
      <section class="section">
        <div class="section-card">
          <div class="section-header">
            <h2>What This Is</h2>
            <p>Not a catalog pretending to be a craft shop. Not a polished luxury pitch either. Just real bench work, good leather, and ideas that end up becoming something you can actually use.</p>
          </div>
          <div class="detail-grid">
            <article class="detail-card">
              <h3>Built To Be Used</h3>
              <p>If it cannot be carried, worn, worked, scuffed up, or handed off to somebody who will actually put it through life, it is probably not the right direction.</p>
            </article>
            <article class="detail-card">
              <h3>Room For Weird Ideas</h3>
              <p>Some pieces are straightforward. Some are oddball customs. Both matter. Half the fun is when a request does not already exist in a clean little product category.</p>
            </article>
            <article class="detail-card">
              <h3>Shop Built When Needed</h3>
              <p>Molds, forms, jigs, and shop tools are part of the work too. Sometimes the thing that has to be made first is the thing that helps make the real thing better.</p>
            </article>
            <article class="detail-card">
              <h3>No Fake Storytelling</h3>
              <p>The site is supposed to feel like the actual bench. Good work, rough edges, progress photos, mistakes, fixes, and finished pieces all living in the same world.</p>
            </article>
          </div>
        </div>
      </section>
    `,
  });
}

function renderCustomOrdersPage(sectionEntries) {
  const customLead = sectionEntries["custom-pieces"][0];

  return renderLayout({
    title: `Custom Orders | ${site.name}`,
    description: "How custom work usually starts, what to send, and what to expect.",
    currentPath: "/custom-orders/",
    body: `
      ${renderPageHero({
        currentPath: "/custom-orders/",
        eyebrow: "custom jobs / one-offs / strange requests welcome",
        title: "Custom Orders",
        copy: "Custom work is usually pretty simple on the front end. You send the idea, we talk through the job, and then I figure out whether it is a quick make, a true one-off, or something that needs a little figuring out first.",
        primaryCta: { href: withBase("/contact/"), label: "Send The Idea" },
        secondaryCta: { href: withBase("/custom-pieces/"), label: "See Examples" },
        calloutLabel: "Good To Know",
        calloutTitle: "Half-baked ideas are fine",
        calloutCopy: "You do not need a perfect spec sheet. A rough idea, a few measurements, and a good sense of what the piece needs to do is usually enough to start.",
        imageUrl: customLead.images[0],
        imageAlt: customLead.heroAlt,
      })}
      <section class="section">
        <div class="section-card">
          <div class="section-header">
            <h2>What Helps</h2>
            <p>The better the starting info, the less guessing has to happen.</p>
          </div>
          <div class="process-layout">
            <div class="process-step">
              <span>01</span>
              <h3>Tell Me What It Is For</h3>
              <p>Not just what it looks like. What it needs to hold, protect, fit, hang on, strap to, or survive.</p>
            </div>
            <div class="process-step">
              <span>02</span>
              <h3>Send Size Or Fit Notes</h3>
              <p>If it needs to fit a tool, knife, notebook, belt size, or weird object, send those details early.</p>
            </div>
            <div class="process-step">
              <span>03</span>
              <h3>Show References If You Have Them</h3>
              <p>Photos, sketches, rough doodles, screenshots, or “something like this but not exactly” all help.</p>
            </div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-card">
          <div class="section-header">
            <h2>What To Expect</h2>
            <p>Every custom is a little different, but the rhythm is usually the same.</p>
          </div>
          <div class="detail-grid">
            <article class="detail-card">
              <h3>Some Jobs Are Straightforward</h3>
              <p>Those are the easy ones. Quick discussion, clear dimensions, then get to work.</p>
            </article>
            <article class="detail-card">
              <h3>Some Need Bench Time First</h3>
              <p>If it is a new pattern, a weird fit, or something that needs tooling built around it, there may be a little setup before the finished piece happens.</p>
            </article>
            <article class="detail-card">
              <h3>Updates Happen In Real Life</h3>
              <p>Fresh photos and progress tend to show up on social first, which is another reason to message there.</p>
            </article>
            <article class="detail-card">
              <h3>Not Everything Becomes A Catalog Item</h3>
              <p>Some jobs stay one-offs forever. That is part of the point.</p>
            </article>
          </div>
        </div>
      </section>
    `,
  });
}

function renderContactPage(sectionEntries) {
  const workbenchLead = sectionEntries["workbench"][0];

  return renderLayout({
    title: `Contact | ${site.name}`,
    description: "Where to message and what to send if you want to start a build.",
    currentPath: "/contact/",
    body: `
      ${renderPageHero({
        currentPath: "/contact/",
        eyebrow: "message me here",
        title: "Contact",
        copy: "If you want to ask about a piece, a custom order, or whether something is available right now, social is still the easiest way to get through to me.",
        primaryCta: { href: site.facebook, label: "Message On Facebook" },
        secondaryCta: { href: site.instagram, label: "Open Instagram" },
        calloutLabel: "Best First Message",
        calloutTitle: "Keep it simple",
        calloutCopy: "Tell me what the piece needs to do, what it needs to fit, and anything important about the look. That is enough to start a real conversation.",
        imageUrl: workbenchLead.images[0],
        imageAlt: workbenchLead.heroAlt,
      })}
      <section class="section">
        <div class="section-card section-card-accent">
          <div class="section-header">
            <h2>Fastest Way In</h2>
            <p>These are still the main doors into the shop.</p>
          </div>
          ${renderSocialLinks()}
        </div>
      </section>
      <section class="section">
        <div class="section-card">
          <div class="section-header">
            <h2>What To Send</h2>
            <p>You do not need a perfect message. Just enough to point things in the right direction.</p>
          </div>
          <div class="detail-grid">
            <article class="detail-card">
              <h3>The Job</h3>
              <p>What the piece is supposed to be, what it is for, and whether this is a repeatable item or a one-off idea.</p>
            </article>
            <article class="detail-card">
              <h3>Fit Notes</h3>
              <p>Dimensions, sizes, belt width, tool model, blade length, notebook size, or anything else the build has to fit around.</p>
            </article>
            <article class="detail-card">
              <h3>Look And Feel</h3>
              <p>Color, tooling, carved patterns, rough references, or just “something darker and meaner than this one.”</p>
            </article>
            <article class="detail-card">
              <h3>Anything Weird</h3>
              <p>If the request is strange, specific, or hard to explain, that is fine. Send it anyway.</p>
            </article>
          </div>
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
              <a class="button button-primary" href="${withBase("/contact/")}">Message Me</a>
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
  await writePage("about", "index.html", renderAboutPage(sectionEntries));
  await writePage("custom-orders", "index.html", renderCustomOrdersPage(sectionEntries));
  await writePage("contact", "index.html", renderContactPage(sectionEntries));

  for (const section of sections) {
    const html = renderGalleryPage(section, sectionEntries[section.slug]);
    await writePage(section.slug, "index.html", html);
  }
}

buildSite().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
