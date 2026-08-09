import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const contentDir = path.join(rootDir, "content");
const outputDir = rootDir;
const siteBasePath = normalizeBasePath(process.env.SITE_BASE_PATH || "");
const inlineSiteCss = await readFile(path.join(rootDir, "assets", "site.css"), "utf8");
const localAssetVersion = "2026-05-14-conversion-pass-v1";
const buildStamp = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
}).format(new Date());

const site = {
  name: "Horizon Creations",
  description:
    "Handmade leather goods, custom work, bench-built tools, and the rough shop side of Horizon Creations.",
  instagram: "https://instagram.com/horizoncreations.art/",
  facebook: "https://www.facebook.com/pcmalone",
  facebookPage: "https://www.facebook.com/profile.php?id=61574262374190",
  facebookGroup: "https://www.facebook.com/groups/4037537753210600",
  youtube: "https://www.youtube.com/@HorizonCreations-art",
  tiktok: "https://www.tiktok.com/@curtismalone82",
  discord: process.env.SITE_DISCORD_URL || "https://discord.gg/eWPXc8xF82",
  cults3d: "https://cults3d.com/en/users/horizoncreations/3d-models",
  tipJar: {
    url: "https://www.paypal.com/ncp/payment/TDSAPDXAFZLES",
    label: "Maker Help",
    title: "Need help making a file printable?",
    copy:
      "Logo cleanup, raised or embossed graphics, stamp-ready art, simple 3D print prep, and weird maker-file rescue.",
    cta: "Tip / Support Maker Help",
  },
  logo: "/HorizonCreaion-Base-logo.jpg",
  footer: "Horizon Creations. Handmade leather goods, custom work, and bench-built tools.",
  lastUpdated: `Last updated ${buildStamp}.`,
  disclaimer: "This page was built with AI and we're still working the gremlins.",
  stats: {
    instagramFollowers: "1,493",
    curtisFacebookFollowers: "1.5K",
    facebookPageLikes: "82",
    statsCheckedOn: "May 13, 2026",
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
      "Regular builds. Journals, pouches, straps, sheaths, and other pieces I can make again.",
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
      "The shop side of it. Tools, forms, scraps, and half-finished pieces.",
  },
];

const infoPages = [
  { href: "/about/", label: "About" },
  { href: "/custom-orders/", label: "Custom Orders" },
  { href: "/contact/", label: "Contact" },
];

const stlMarketplace = {
  label: "STL Files",
  eyebrow: "Digital tools / FDM printing",
  title: "FDM Leather Stamp STL Packs",
  summary:
    "Digital STL files for FDM-printed leather stamp tools, built for small-shop leatherworkers and 3D printer users.",
  ctaLabel: "Shop STL Files on Cults3D",
  disclaimer:
    "Digital files only. These are STL files for 3D printing leather press stamps. Results depend on printer settings, filament, leather casing, and press pressure. Test on scrap first.",
};

const stlPacks = [
  {
    title: "Bracelet Pack 1",
    summary: "Nature, potion, and border-style bracelet stamp files tested on veg tan.",
    image: "/Cults3D/Bracelet 10 pack-1/Bracelet Pack 1 -all10.jpg",
    imageAlt: "Bracelet stamp STL pack one samples by Horizon Creations",
  },
  {
    title: "Bracelet Pack 2",
    summary: "More bracelet panel experiments with floral, skull, crystal, and gate motifs.",
    image: "/Cults3D/Bracelet 10 pack-2/20260512_141802.jpg",
    imageAlt: "Bracelet stamp STL pack two samples by Horizon Creations",
  },
  {
    title: "Plague Doctor Pack 1",
    summary: "Darker maker-side plague doctor stamp files for banners, bottles, ravens, and potion work.",
    image: "/Cults3D/Plague Doctor 10 pack-1/20260513_122737.jpg",
    imageAlt: "Plague Doctor leather stamp STL pack samples by Horizon Creations",
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

function withLocalAssetVersion(urlPath) {
  const localPath = withBase(urlPath);
  return `${localPath}${localPath.includes("?") ? "&" : "?"}v=${localAssetVersion}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderZoomImage({ className, src, alt }) {
  const safeAlt = escapeHtml(alt);

  return `
    <button class="photo-zoom-button" type="button" data-photo-full="${src}" data-photo-alt="${safeAlt}" aria-label="Open larger photo: ${safeAlt}">
      <img class="${className}" src="${src}" alt="${safeAlt}">
      <span class="photo-zoom-label">View larger</span>
    </button>`;
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
    const excludedImages = new Set(
      Array.isArray(data.excludedImages) ? data.excludedImages : [],
    );

    const imageFiles = files
      .filter((file) => file.isFile() && imageExtensions.has(path.extname(file.name).toLowerCase()))
      .map((file) => file.name)
      .filter((fileName) => !excludedImages.has(fileName))
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
        (fileName) => withLocalAssetVersion(`/content/${section.slug}/${folder.name}/${fileName}`),
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
    { href: "/#stl-files", label: "STL Files" },
    { href: "/#maker-help", label: "Maker Help" },
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
          ${renderZoomImage({ className: "callout-preview", src: imageUrl, alt: imageAlt })}
        </aside>
      </div>
    </section>
  `;
}

function renderPhotoLightboxScript() {
  return `
<script>
(() => {
  const triggers = document.querySelectorAll("[data-photo-full]");

  if (!triggers.length) {
    return;
  }

  const lightbox = document.createElement("div");
  lightbox.className = "photo-lightbox";
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");
  lightbox.setAttribute("aria-label", "Expanded photo viewer");
  lightbox.hidden = true;
  lightbox.innerHTML = \`
    <button class="photo-lightbox-close" type="button" aria-label="Close expanded photo">Close</button>
    <figure class="photo-lightbox-frame">
      <img class="photo-lightbox-image" alt="">
      <figcaption class="photo-lightbox-caption"></figcaption>
    </figure>
  \`;

  document.body.appendChild(lightbox);

  const closeButton = lightbox.querySelector(".photo-lightbox-close");
  const image = lightbox.querySelector(".photo-lightbox-image");
  const caption = lightbox.querySelector(".photo-lightbox-caption");
  let lastFocused = null;

  function openLightbox(trigger) {
    lastFocused = trigger;
    image.src = trigger.dataset.photoFull;
    image.alt = trigger.dataset.photoAlt || "";
    caption.textContent = trigger.dataset.photoAlt || "";
    lightbox.hidden = false;
    document.body.classList.add("photo-lightbox-open");
    closeButton.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    document.body.classList.remove("photo-lightbox-open");
    image.removeAttribute("src");

    if (lastFocused) {
      lastFocused.focus();
    }
  }

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => openLightbox(trigger));
  });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) {
      closeLightbox();
    }
  });
})();
</script>`;
}

function renderLayout({ title, description, currentPath, bodyClass = "", body }) {
  const impactTrackingScript =
    currentPath === "/"
      ? `<script type="text/javascript">(function(i,m,p,a,c,t){c.ire_o=p;c[p]=c[p]||function(){(c[p].a=c[p].a||[]).push(arguments)};t=a.createElement(m);var z=a.getElementsByTagName(m)[0];t.async=1;t.src=i;z.parentNode.insertBefore(t,z)})('https://utt.impactcdn.com/P-A7313052-151f-4eee-9a2e-fa3a502160c51.js','script','impactStat',document,window);impactStat('transformLinks');impactStat('trackImpression');</script>`
      : "";
  const vaultPromoStylesheet = currentPath === "/"
    ? `<link rel="stylesheet" href="${withBase("/assets/vault-promo.css?v=2026-08-08")}">`
    : "";
  const vaultPromo = currentPath === "/"
    ? `<aside class="vault-promo-shell" aria-label="Featured Horizon Creations project">
      <details class="vault-promo">
        <summary>
          <span class="vault-promo-avatar" aria-hidden="true"><img src="${withBase("/vault/static/assistant-cards/assistant-card-01-maker.webp")}" alt=""></span>
          <span class="vault-promo-title"><small>New project</small><strong>Meet Vault Compiler.</strong></span>
          <span class="vault-promo-tease">A personal assistant built around your life</span>
          <span class="vault-promo-toggle" aria-hidden="true"></span>
        </summary>
        <div class="vault-promo-drawer">
          <div><p class="vault-promo-kicker">Private pilot now forming</p><p>Vault Compiler turns the way you already work, plan, create, and keep track of things into a portable assistant starter workspace—with human review and boundaries you control.</p></div>
          <a class="vault-promo-link" href="${withBase("/vault/")}">Check out Vault Compiler <span aria-hidden="true">→</span></a>
        </div>
      </details>
    </aside>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="icon" type="image/jpeg" href="${withBase(site.logo)}">
<link rel="stylesheet" href="${withBase("/assets/site.css")}">
${vaultPromoStylesheet}
<style>
${inlineSiteCss}
</style>
${impactTrackingScript}
</head>
<body class="${bodyClass}">
  <div class="page-shell">
    ${vaultPromo}
    <main class="site-frame">
      ${renderNav(currentPath)}
      ${body}
      <footer class="footer">
        <div>${escapeHtml(site.footer)}</div>
        <div class="footer-links">
          <a href="${site.facebook}" target="_blank" rel="noreferrer">Facebook</a>
          <a href="${site.facebookPage}" target="_blank" rel="noreferrer">Facebook Page</a>
          <a href="${site.facebookGroup}" target="_blank" rel="noreferrer">Facebook Group</a>
          <a href="${site.instagram}" target="_blank" rel="noreferrer">Instagram</a>
          <a href="${site.youtube}" target="_blank" rel="noreferrer">YouTube</a>
          <a href="${site.tiktok}" target="_blank" rel="noreferrer">TikTok</a>
          <a href="${site.discord}" target="_blank" rel="noreferrer">Discord</a>
          <a href="${site.cults3d}" target="_blank" rel="noreferrer">Cults3D STL Files</a>
          <a href="${site.tipJar.url}" target="_blank" rel="noreferrer">Maker Help Tip Jar</a>
        </div>
        ${site.lastUpdated ? `<div class="footer-update">${escapeHtml(site.lastUpdated)}</div>` : ""}
        ${site.disclaimer ? `<div class="footer-disclaimer">${escapeHtml(site.disclaimer)}</div>` : ""}
      </footer>
    </main>
  </div>
  ${renderPhotoLightboxScript()}
</body>
</html>
`;
}

function renderSocialLinks({ spotlight = false } = {}) {
  const gridClass = spotlight ? "social-grid social-grid-spotlight" : "social-grid";
  const discordLink = site.discord
    ? `
      <a class="social-link" href="${site.discord}" target="_blank" rel="noreferrer">
        <strong>Discord</strong>
        <span>Join The Shop for build talk, custom-order questions, bench updates, and community projects.</span>
      </a>`
    : "";

  return `
    <div class="${gridClass}">
      <a class="social-link" href="${site.facebook}" target="_blank" rel="noreferrer">
        <strong>Curtis Malone On Facebook</strong>
        <span>Main public profile. This is where I post more often, where the monetized posts live, and where the person behind Horizon Creations shows up directly.</span>
      </a>
      <a class="social-link" href="${site.facebookPage}" target="_blank" rel="noreferrer">
        <strong>Horizon Creations Page</strong>
        <span>The business page still matters. It is the cleaner public shop signal for Horizon Creations updates, page proof, and leatherwork receipts.</span>
      </a>
      <a class="social-link" href="${site.facebookGroup}" target="_blank" rel="noreferrer">
        <strong>3D Printing &amp; Lasers for Leather Workers</strong>
        <span>A new group for leatherworkers using printers, lasers, CNC, molds, jigs, templates, stamps, and shop-built tools. Real tests, settings, failures, and useful shop nonsense belong there.</span>
      </a>
      <a class="social-link" href="${site.instagram}" target="_blank" rel="noreferrer">
        <strong>Instagram</strong>
        <span>Bench photos, in-progress shots, and new work as it comes together.</span>
      </a>
      <a class="social-link" href="${site.youtube}" target="_blank" rel="noreferrer">
        <strong>YouTube</strong>
        <span>Short bench clips, process shots, and maker-side updates in motion.</span>
      </a>
      <a class="social-link" href="${site.tiktok}" target="_blank" rel="noreferrer">
        <strong>TikTok</strong>
        <span>Quick maker clips, printer runs, bench chaos, and short hits from the shop side as they happen.</span>
      </a>
      <a class="social-link" href="${site.cults3d}" target="_blank" rel="noreferrer">
        <strong>Cults3D</strong>
        <span>Digital STL files for FDM-printed leather stamp tools, bracelet stamps, and small-shop tooling experiments.</span>
      </a>
      <a class="social-link social-link-tip" href="${site.tipJar.url}" target="_blank" rel="noreferrer">
        <strong>${escapeHtml(site.tipJar.title)}</strong>
        <span>${escapeHtml(site.tipJar.copy)}</span>
      </a>
      ${discordLink}
    </div>
  `;
}

function renderTipJarSection() {
  return `
      <section class="section" id="maker-help">
        <div class="section-card maker-lanes-card">
          <div class="section-header">
            <h2>Maker Help</h2>
            <p>File rescue, printable stamp prep, and the digital tool shelf are easier to find now.</p>
          </div>
          <div class="maker-lane-grid">
            <article class="maker-lane maker-lane-help">
              <p class="eyebrow">${escapeHtml(site.tipJar.label)}</p>
              <h3>${escapeHtml(site.tipJar.title)}</h3>
              <p>${escapeHtml(site.tipJar.copy)}</p>
              <a class="button button-primary tip-jar-button" href="${site.tipJar.url}" target="_blank" rel="noreferrer">${escapeHtml(site.tipJar.cta)}</a>
            </article>
            <article class="maker-lane maker-lane-stl">
              <p class="eyebrow">${escapeHtml(stlMarketplace.eyebrow)}</p>
              <h3>Print your own leather stamp tools.</h3>
              <p>Bracelet stamps, border panels, plague doctor stamps, and other FDM-tested leather tooling experiments live on Cults3D.</p>
              <a class="button button-secondary" href="${site.cults3d}" target="_blank" rel="noreferrer">${escapeHtml(stlMarketplace.ctaLabel)}</a>
            </article>
          </div>
        </div>
      </section>
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
        <div class="stat-label">Curtis Facebook Followers</div>
        <div class="stat-value">${escapeHtml(site.stats.curtisFacebookFollowers)}</div>
        <p class="stat-note">What your personal Facebook profile was showing in the current profile view.</p>
      </article>
      <article class="stat-card">
        <div class="stat-label">Horizon Page Likes</div>
        <div class="stat-value">${escapeHtml(site.stats.facebookPageLikes)}</div>
        <p class="stat-note">Current public likes on the Horizon Creations Facebook page.</p>
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
      ${renderMarketplaceCategoryCard()}
    </div>
  `;
}

function renderMarketplaceCategoryCard() {
  return `
    <a class="category-link category-link-marketplace" href="${site.cults3d}" target="_blank" rel="noreferrer">
      <img src="${withLocalAssetVersion(stlPacks[0].image)}" alt="${escapeHtml(stlPacks[0].imageAlt)}">
      <div>
        <span>${escapeHtml(stlMarketplace.eyebrow)}</span>
        <h3>${escapeHtml(stlMarketplace.title)}</h3>
        <p>${escapeHtml(`${stlMarketplace.summary} Three packs are live now on Cults3D.`)}</p>
      </div>
    </a>
  `;
}

function renderMarketplacePackCards() {
  return stlPacks.map((pack) => `
          <a class="marketplace-pack-card" href="${site.cults3d}" target="_blank" rel="noreferrer">
            <img src="${withLocalAssetVersion(pack.image)}" alt="${escapeHtml(pack.imageAlt)}">
            <strong>${escapeHtml(pack.title)}</strong>
            <span>${escapeHtml(pack.summary)}</span>
          </a>
        `).join("");
}

function renderStlMarketplaceSection() {
  return `
      <section class="section" id="stl-files">
        <div class="section-card marketplace-section">
          <div class="marketplace-copy">
            <div class="marketplace-header">
              <p class="eyebrow">3D printed leather stamp files</p>
              <h2>STL Files For Leatherworkers</h2>
              <p>
                Now offering digital STL files for FDM-printed leather stamp tools - bracelet stamps,
                border panels, and small-shop tooling experiments designed for leatherworkers with 3D printers.
              </p>
            </div>
            <p>
              This is an added product lane beside the leatherwork: experimental tools tested on veg tan leather,
              built for makers who want to print, press, adjust, and keep learning at the bench.
            </p>
            <p>
              Right now the Cults3D shelf includes three active packs: Bracelet Pack 1, Bracelet Pack 2, and Plague Doctor Pack 1.
            </p>
            <p class="marketplace-disclaimer">${escapeHtml(stlMarketplace.disclaimer)}</p>
            <div class="button-row">
              <a class="button button-primary" href="${site.cults3d}" target="_blank" rel="noreferrer">${escapeHtml(stlMarketplace.ctaLabel)}</a>
              <a class="button button-secondary" href="${withBase("/workbench/")}">See Workbench</a>
            </div>
          </div>
          <div class="marketplace-preview-grid">
            ${renderMarketplacePackCards()}
          </div>
        </div>
      </section>
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
            renderZoomImage({
              className: "thumb-image",
              src: imageUrl,
              alt: `${entry.title} detail ${index + 1}`,
            }),
        )
        .join("")}</div>`
    : "";

  return `
    <article class="entry-card">
      <div class="entry-hero-wrap">
        ${renderZoomImage({ className: "entry-hero", src: entry.images[0], alt: entry.heroAlt })}
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
        <a class="entry-link" href="${withBase("/contact/")}">Ask About This Piece</a>
      </div>
    </article>
  `;
}

function renderFeaturedWorkStrip(entries) {
  return `
      <section class="section visual-strip-section">
        <div class="visual-strip">
          ${entries
            .map(
              (entry) => `
                <a class="visual-feature" href="${withBase(`/${entry.section.slug}/`)}">
                  <img src="${entry.images[0]}" alt="${escapeHtml(entry.heroAlt)}">
                  <span>${escapeHtml(entry.section.label)}</span>
                  <strong>${escapeHtml(entry.title)}</strong>
                </a>
              `,
            )
            .join("")}
        </div>
      </section>
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
            <p>Current ${escapeHtml(section.label.toLowerCase())} on the site.</p>
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
            <p>If you want one like it, send me a message.</p>
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
  const standardLead = sectionEntries["standard-pieces"][0];
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
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="eyebrow">Leather / tools / custom work / shop</p>
            <h1>Handmade leather goods built to get used.</h1>
            <p>
              This is the home base for Horizon Creations. I make leather journals, custom pieces,
              and the bench-built tools that help me make them.
            </p>
            <p>
              Finished journals and carry pieces are up in Standard Pieces now. Custom work and bench photos are split
              into their own sections so you can go straight to what you want.
            </p>
            <p>
              Need custom leatherwork, FDM stamp files, or help making a logo or sketch printable? Start with the lane
              that fits the job.
            </p>
            <div class="button-row hero-actions">
              <a class="button button-primary" href="${withBase("/contact/")}">Message Me</a>
              <a class="button button-secondary" href="${site.cults3d}" target="_blank" rel="noreferrer">Shop STL Files</a>
              <a class="button button-secondary" href="${withBase("/#maker-help")}">Maker Help</a>
            </div>
          </div>
          <aside class="hero-card">
            <div>
              <div class="hero-card-label">Bench Right Now</div>
              <strong>Finished journals and a carry pouch are up now.</strong>
            </div>
            <p>
              Heresy, Banzai, Turtles, Green Mushroom, and the everyday carry pouch are on the shelf now.
              Message me if you want one.
            </p>
            ${renderZoomImage({
              className: "hero-preview",
              src: withLocalAssetVersion("/assets/images/home/journals-group.jpg"),
              alt: "Finished Horizon Creations journals grouped together",
            })}
          </aside>
        </div>
      </section>
      ${renderFeaturedWorkStrip(featuredEntries)}
      ${renderTipJarSection()}
      <section class="section" id="connect">
        <div class="section-card section-card-accent connect-spotlight">
          <div class="section-header">
            <h2>Find Me Here</h2>
            <p>Message me here, follow new work here, and keep up with what is coming off the bench.</p>
          </div>
          <div class="connect-spotlight-grid">
            <div class="connect-spotlight-copy">
              <p class="lede">
                Curtis Malone on Facebook is the main public feed right now. The Horizon Creations page still carries the business/shop signal, the leatherworker printer-and-laser group is where the tooling crossover lives, Instagram carries bench photos, YouTube and TikTok carry motion and process, and the FDM stamp files live on Cults3D.
              </p>
              ${renderSocialLinks({ spotlight: true })}
            </div>
            ${renderStatsGrid()}
          </div>
        </div>
      </section>
      ${renderStlMarketplaceSection()}
      <section class="section">
        <div class="section-card">
          <div class="section-header">
            <h2>What Is On The Bench</h2>
            <p>
              Standard Pieces is repeatable leatherwork. Custom Pieces is one-offs and commissions. Workbench is tools, test pieces, and in-progress photos.
              STL Files are digital stamp-tool packs for makers with FDM printers.
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
              Current site picks.
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
