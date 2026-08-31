import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  customPieces,
  imageDimensions,
  processSteps,
  products,
  site,
  soldPieces,
  toolsLane,
} from "../site-v2/catalog.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, "..");
const distDir = path.resolve(rootDir, "dist");
const clientDir = path.join(distDir, "client");
const serverDir = path.join(distDir, "server");
const sourceDir = path.join(rootDir, "site-v2");

function assertWithinRoot(target) {
  const relative = path.relative(rootDir, path.resolve(target));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing unsafe build target: ${target}`);
  }
}

assertWithinRoot(distDir);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function jsonScript(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}

function withOrigin(route) {
  return new URL(route, site.origin).toString();
}

function picture(name, alt, {
  className = "",
  sizes = "100vw",
  loading = "lazy",
  fetchPriority = "auto",
} = {}) {
  const [width, height] = imageDimensions[name];
  const safeAlt = escapeHtml(alt);
  const safeClass = escapeHtml(className);
  return `<picture>
    <source type="image/webp" srcset="/images/${name}-480.webp 480w, /images/${name}-800.webp 800w, /images/${name}-1200.webp 1200w, /images/${name}-1600.webp 1600w" sizes="${escapeHtml(sizes)}">
    <img${safeClass ? ` class="${safeClass}"` : ""} src="/images/${name}-800.webp" alt="${safeAlt}" width="${width}" height="${height}" loading="${loading}" decoding="async" fetchpriority="${fetchPriority}">
  </picture>`;
}

function nav(currentPath, solid = false) {
  const items = [
    ["/shop/", "Shop"],
    ["/custom-work/", "Custom Work"],
    ["/workbench/", "Workbench"],
    ["/about/", "About"],
    ["/contact/", "Contact"],
  ];
  return `<header class="site-header${solid ? " is-solid" : ""}">
    <div class="header-inner">
      <a class="wordmark" href="/" aria-label="Horizon Creations home">
        <span class="wordmark-mark" aria-hidden="true"></span>
        <span>Horizon<br>Creations</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav" data-nav-toggle>
        <span class="nav-toggle-lines" aria-hidden="true"></span>
        <span class="sr-only">Toggle navigation</span>
      </button>
      <nav class="primary-nav" id="primary-nav" aria-label="Primary" data-nav-panel data-open="false">
        ${items.map(([href, label]) => `<a href="${href}"${currentPath.startsWith(href) ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
      </nav>
    </div>
  </header>`;
}

function footer() {
  return `<footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-top">
        <p class="footer-statement">Horizon Creations. Handmade leather goods, custom work, and bench-built tools from Northern California.</p>
        <nav class="footer-links" aria-label="Social and marketplace links">
          <a href="${site.facebook}" target="_blank" rel="noreferrer">Curtis on Facebook</a>
          <a href="${site.facebookPage}" target="_blank" rel="noreferrer">Horizon Facebook Page</a>
          <a href="${site.instagram}" target="_blank" rel="noreferrer">Instagram</a>
          <a href="${site.youtube}" target="_blank" rel="noreferrer">YouTube</a>
          <a href="${site.tiktok}" target="_blank" rel="noreferrer">TikTok</a>
          <a href="${site.cults3d}" target="_blank" rel="noreferrer">Leather Stamp Files</a>
        </nav>
      </div>
      <div class="footer-credit-row">
        <a class="footer-credit" href="https://www.maloneintegratedtech.com/" target="_blank" rel="noopener noreferrer" aria-label="Website by Malone Integrated Tech">
          <span class="footer-credit-label">Website by</span>
          <span class="footer-credit-lockup" aria-hidden="true">
            <img src="/brand/malone-lockup.png" alt="" width="1800" height="675" loading="lazy" decoding="async">
          </span>
        </a>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getUTCFullYear()} Horizon Creations</span>
        <span>Real leather changes as you use it. I build for that.</span>
      </div>
    </div>
  </footer>`;
}

function dialog() {
  return `<dialog class="image-viewer" id="image-viewer" aria-label="Expanded product photo">
    <button class="image-viewer-close" type="button" data-dialog-close aria-label="Close expanded image">×</button>
    <figure>
      <img alt="" width="1600" height="1200" loading="lazy" decoding="async">
      <figcaption></figcaption>
    </figure>
  </dialog>`;
}

function layout({
  title,
  description,
  currentPath,
  body,
  solidHeader = false,
  schema = [],
}) {
  const fullTitle = title === site.name ? title : `${title} | ${site.name}`;
  const canonical = withOrigin(currentPath);
  const schemaItems = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: site.name,
      url: site.origin,
      description: site.description,
      sameAs: [site.facebookPage, site.instagram, site.youtube, site.tiktok],
    },
    ...schema,
  ];
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${site.origin}/og.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${site.origin}/og.jpg">
  <meta name="theme-color" content="#15120f">
  <link rel="icon" type="image/jpeg" href="/favicon.jpg">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="stylesheet" href="/assets/site.css">
  <script type="application/ld+json">${jsonScript(schemaItems)}</script>
  <script type="module" src="/assets/site.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  ${nav(currentPath, solidHeader)}
  <main id="main">
    ${body}
  </main>
  ${footer()}
  ${dialog()}
</body>
</html>`;
}

function stateClass(state) {
  return state === "SOLD" ? " state-sold" : "";
}

function homePage() {
  const [available, madeToOrder] = products;
  const processHtml = processSteps.map((step) => `<article class="process-step" data-reveal>
    <div class="process-step-media">${picture(step.image, step.alt, { sizes: "(max-width: 900px) 86vw, 45vw" })}</div>
    <div class="process-step-copy">
      <span class="process-number">${step.number} / 06</span>
      <p class="process-verb">${step.verb}</p>
      <h3>${step.title}</h3>
      <p>${step.copy}</p>
    </div>
  </article>`).join("");

  const soldHtml = soldPieces.map((piece) => `<figure class="past-piece" data-reveal>
    <div class="past-media">${picture(piece.image, piece.alt, { sizes: "(max-width: 620px) 94vw, (max-width: 900px) 46vw, 31vw" })}</div>
    <figcaption>
      <span class="state${stateClass(piece.state)}">${piece.state}</span>
      <h3>${piece.title}</h3>
      <p>${piece.summary}</p>
    </figcaption>
  </figure>`).join("");

  return layout({
    title: site.name,
    description: site.description,
    currentPath: "/",
    body: `
      <section class="home-hero">
        ${picture("hero-journals", "Finished hand-tooled leather journals from Horizon Creations", { className: "home-hero-media", sizes: "100vw", loading: "eager", fetchPriority: "high" })}
        <div class="hero-inner">
          <div class="hero-copy" data-reveal>
            <p class="eyebrow">The Living Workbench</p>
            <h1>${site.tagline}</h1>
            <p class="hero-support">Built at my bench in Northern California. Real leather, real marks, and pieces made for the life they pick up along the way.</p>
            <div class="button-row">
              <a class="button button-primary" href="/shop/">Shop available pieces</a>
              <a class="button" href="/custom-work/">Start a custom piece</a>
            </div>
          </div>
        </div>
      </section>

      <section class="section material-intro">
        <div class="section-inner material-grid">
          <div class="material-copy" data-reveal>
            <p class="eyebrow">Material first</p>
            <h2>Leather keeps the story.</h2>
            <p>It changes under a tool, darkens under dye, and picks up marks when you carry it. That is not something I design around. It is what I design for.</p>
            <ul class="material-notes">
              <li><span>01</span><div><strong>Real leather varies.</strong><br>Grain, color, and small marks make each build its own.</div></li>
              <li><span>02</span><div><strong>Built by hand.</strong><br>Patterns help; judgment at the bench finishes the piece.</div></li>
              <li><span>03</span><div><strong>Modern tools earn their place.</strong><br>I use them when they improve accuracy, repeatability, or the work itself.</div></li>
            </ul>
          </div>
          <div class="material-frame" data-reveal>
            ${picture("process-detail", "Close detail of carved and colored tree of life leatherwork", { sizes: "(max-width: 900px) 94vw, 50vw" })}
          </div>
        </div>
      </section>

      <section class="section shop-section" id="available">
        <div class="section-inner">
          <div class="section-heading" data-reveal>
            <div><p class="eyebrow">On the bench now</p><h2>Available pieces.</h2></div>
            <p>One finished journal is ready now. The carry pouch is a repeatable pattern I can build to order. The state on each piece is the truth—not a hopeful inventory guess.</p>
          </div>
          <div class="product-feature-grid">
            ${[available, madeToOrder].map((product) => `<article class="product-feature" data-reveal>
              <a class="product-media" href="/shop/${product.slug}/" aria-label="View ${product.title}">
                ${picture(product.hero, product.alt, { sizes: "(max-width: 900px) 94vw, 47vw" })}
              </a>
              <div class="product-body">
                <div class="product-meta"><span class="state">${product.state}</span><span class="price">${product.priceLabel}</span></div>
                <h3>${product.title}</h3>
                <p>${product.summary}</p>
                <a class="product-link" href="/shop/${product.slug}/">See the piece</a>
              </div>
            </article>`).join("")}
          </div>
        </div>
      </section>

      <section class="section custom-section">
        <div class="section-inner custom-grid">
          <div class="custom-collage" aria-label="Examples of custom leatherwork" data-reveal>
            <figure>${picture("custom-tree", "Custom Tree of Life leather pair", { sizes: "(max-width: 900px) 76vw, 46vw" })}</figure>
            <figure>${picture("custom-turtle", "Blue custom leather journal cover with carved sea turtle", { sizes: "(max-width: 900px) 58vw, 28vw" })}</figure>
          </div>
          <div class="custom-copy" data-reveal>
            <p class="eyebrow">Custom work</p>
            <h2>Strange ideas welcome.</h2>
            <p>You do not need a perfect sketch or leatherworking vocabulary. Tell me what the piece needs to do, what it should fit, and the part of the idea you care about most.</p>
            <div class="custom-steps">
              ${["Show me the idea", "Tell me what it needs to do", "We work out the details", "You approve the direction", "I build it"].map((step, index) => `<div class="custom-step"><span>${String(index + 1).padStart(2, "0")}</span><strong>${step}</strong></div>`).join("")}
            </div>
            <a class="button button-primary" href="/custom-work/">See custom work</a>
          </div>
        </div>
      </section>

      <section class="section workbench-section">
        <div class="section-inner">
          <div class="process-intro" data-reveal>
            <p class="eyebrow">The Living Workbench</p>
            <h2>From hide to finished piece.</h2>
            <p>Good leatherwork is a sequence of small decisions. The bench gets messier, the material gets more specific, and eventually the thing starts looking like it knew where it was going all along.</p>
          </div>
          <div class="process-list" data-reveal>
            ${processHtml}
          </div>
        </div>
      </section>

      <section class="tools-section">
        <div class="section-inner tools-grid">
          <div class="tools-media" data-reveal>${picture(toolsLane.image, toolsLane.alt, { sizes: "(max-width: 900px) 94vw, 44vw" })}</div>
          <div class="tools-copy" data-reveal>
            <p class="eyebrow">Secondary bench lane</p>
            <h2>${toolsLane.title}.</h2>
            <p>${toolsLane.copy}</p>
            <a class="text-link" href="${site.cults3d}" target="_blank" rel="noreferrer">Browse leather stamp files</a>
          </div>
        </div>
      </section>

      <section class="section past-section">
        <div class="section-inner">
          <div class="section-heading" data-reveal>
            <div><p class="eyebrow">Past pieces</p><h2>Made, carried, gone.</h2></div>
            <p>Sold work stays here because it shows what can come off the bench. It does not pretend to be inventory.</p>
          </div>
          <div class="past-grid">${soldHtml}</div>
        </div>
      </section>

      <section class="section about-band">
        <div class="section-inner about-grid">
          <div data-reveal><p class="eyebrow">About Horizon</p><h2>One maker. One busy bench.</h2></div>
          <div class="about-copy" data-reveal>
            <p>I’m Curtis. Horizon Creations is where leather, tools, stubborn ideas, and a little shop chaos turn into things people can actually use.</p>
            <p>This is not a giant brand operation. It is real bench work: journals, pouches, one-offs, experiments, and the tools I build when the job needs one.</p>
            <a class="text-link" href="/about/">More about the shop</a>
          </div>
        </div>
      </section>

      <section class="contact-band">
        <div class="section-inner" data-reveal>
          <p class="eyebrow" style="justify-content:center">Start the conversation</p>
          <h2>Have something strange in mind?</h2>
          <p>Those are usually the fun ones. Send the rough idea and we will figure out whether it wants to be a standard build, a custom piece, or something that needs a little bench chaos first.</p>
          <div class="button-row">
            <a class="button button-primary" href="/contact/">Tell me the idea</a>
            <a class="button button-quiet" href="/shop/">Shop first</a>
          </div>
        </div>
      </section>`,
  });
}

function pageHero({ eyebrow, title, copy, image, alt, position = "center" }) {
  return `<section class="page-hero">
    ${picture(image, alt, { className: "page-hero-media", sizes: "100vw", loading: "eager", fetchPriority: "high" })}
    <div class="page-hero-inner" style="--hero-position:${position}">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${title}</h1>
      <p>${copy}</p>
    </div>
  </section>`;
}

function shopPage() {
  const rows = products.map((product) => `<article class="shop-row" data-reveal>
    <a class="shop-row-media" href="/shop/${product.slug}/" aria-label="View ${product.title}">${picture(product.hero, product.alt, { sizes: "(max-width: 900px) 94vw, 53vw" })}</a>
    <div class="shop-row-copy">
      <div class="product-meta"><span class="state">${product.state}</span><span class="price">${product.priceLabel}</span></div>
      <p class="eyebrow">${product.eyebrow}</p>
      <h2>${product.title}</h2>
      <p>${product.summary}</p>
      <p>${product.detail}</p>
      <div class="button-row">
        <a class="button button-primary" href="/shop/${product.slug}/">View details</a>
        <a class="button" href="/contact/?piece=${encodeURIComponent(product.title)}&state=${encodeURIComponent(product.state)}">Ask about it</a>
      </div>
    </div>
  </article>`).join("");

  const sold = soldPieces.map((piece) => `<figure class="past-piece" data-reveal>
    <div class="past-media">${picture(piece.image, piece.alt, { sizes: "(max-width: 620px) 94vw, (max-width: 900px) 46vw, 31vw" })}</div>
    <figcaption><span class="state state-sold">SOLD</span><h3>${piece.title}</h3><p>${piece.summary}</p></figcaption>
  </figure>`).join("");

  return layout({
    title: "Shop",
    description: "Available, made-to-order, and sold leather pieces from the Horizon Creations bench.",
    currentPath: "/shop/",
    body: `${pageHero({ eyebrow: "Shop the bench", title: "Pieces with an honest state.", copy: "Available means it is here now. Made to order means I can build the pattern again. Sold means it has already found a home.", image: "heresy-01", alt: products[0].alt })}
      <section class="section shop-section"><div class="section-inner"><div class="shop-listing">${rows}</div></div></section>
      <section class="section past-section"><div class="section-inner"><div class="section-heading" data-reveal><div><p class="eyebrow">Past pieces</p><h2>Sold work, kept as proof.</h2></div><p>These are not available inventory. They stay visible because they show color, tooling, hardware, and the kind of work I can build from.</p></div><div class="past-grid">${sold}</div></div></section>
      <section class="contact-band"><div class="section-inner" data-reveal><h2>Need something different?</h2><p>A custom piece does not have to start with a finished drawing. A rough idea is enough.</p><div class="button-row"><a class="button button-primary" href="/custom-work/">Start custom work</a></div></div></section>`,
  });
}

function productPage(product) {
  const gallery = product.gallery.map((imageName, index) => {
    const alt = index === 0 ? product.alt : `${product.title} detail view ${index}`;
    return `<button class="gallery-button" type="button" data-lightbox="/images/${imageName}-1600.webp" data-alt="${escapeHtml(alt)}" aria-label="Open larger photo: ${escapeHtml(alt)}">
      ${picture(imageName, alt, { sizes: "(max-width: 620px) 94vw, 47vw" })}
      <span>View larger</span>
    </button>`;
  }).join("");
  const availability = product.state === "AVAILABLE" ? "https://schema.org/InStock" : "https://schema.org/PreOrder";
  return layout({
    title: product.title,
    description: `${product.title}: ${product.summary}`,
    currentPath: `/shop/${product.slug}/`,
    solidHeader: true,
    schema: [{
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.summary,
      image: product.gallery.map((name) => `${site.origin}/images/${name}-1600.webp`),
      brand: { "@type": "Brand", name: site.name },
      offers: {
        "@type": "Offer",
        url: withOrigin(`/shop/${product.slug}/`),
        priceCurrency: "USD",
        price: String(product.price),
        availability,
      },
    }],
    body: `<section class="piece-hero"><div class="piece-hero-grid">
      <div class="piece-hero-media">${picture(product.hero, product.alt, { sizes: "(max-width: 900px) 94vw, 54vw", loading: "eager", fetchPriority: "high" })}</div>
      <div class="piece-copy" data-reveal>
        <div class="piece-meta"><span class="state">${product.state}</span><span class="price">${product.priceLabel}</span></div>
        <p class="eyebrow">${product.eyebrow}</p>
        <h1>${product.title}</h1>
        <p>${product.summary}</p>
        <p>${product.detail}</p>
        <dl class="piece-facts">
          <div class="piece-fact"><dt>State</dt><dd>${product.state}</dd></div>
          <div class="piece-fact"><dt>Price</dt><dd>${product.priceLabel}</dd></div>
          <div class="piece-fact"><dt>Material</dt><dd>Hand-dyed leather with bench-selected hardware and finish</dd></div>
          <div class="piece-fact"><dt>Variation</dt><dd>Grain and hand finishing mean no two builds land exactly alike</dd></div>
        </dl>
        <div class="button-row"><a class="button button-primary" href="/contact/?piece=${encodeURIComponent(product.title)}&state=${encodeURIComponent(product.state)}">Ask about this piece</a><a class="button" href="/shop/">Back to shop</a></div>
      </div>
    </div></section>
    <section class="section"><div class="section-inner"><div class="section-heading" data-reveal><div><p class="eyebrow">Look closer</p><h2>Built in the details.</h2></div><p>Open any photograph for a full view of the tooling, color, hardware, and finish.</p></div><div class="gallery-grid">${gallery}</div></div></section>
    <section class="contact-band"><div class="section-inner" data-reveal><h2>${product.state === "AVAILABLE" ? "Want this one?" : "Want one built for you?"}</h2><p>Send the piece name and the part you care about most. I will tell you what is possible and what I need next.</p><div class="button-row"><a class="button button-primary" href="/contact/?piece=${encodeURIComponent(product.title)}&state=${encodeURIComponent(product.state)}">Start the conversation</a></div></div></section>`,
  });
}

function customWorkPage() {
  const projects = customPieces.map((piece) => `<figure class="custom-project" data-reveal>
    <div class="custom-project-media">${picture(piece.image, piece.alt, { sizes: "(max-width: 620px) 94vw, 47vw" })}</div>
    <figcaption><h3>${piece.title}</h3><p>${piece.summary}</p></figcaption>
  </figure>`).join("");
  const steps = [
    ["01", "Show me the idea", "A photo, sketch, reference, or rough description is enough."],
    ["02", "Tell me the job", "What it holds, fits, protects, closes, carries, or survives."],
    ["03", "Work out details", "Size, leather, color, tooling, hardware, timing, and budget."],
    ["04", "Approve direction", "You know what I am building before the real bench time starts."],
    ["05", "I build it", "Updates happen while the piece takes shape."],
  ];
  return layout({
    title: "Custom Work",
    description: "Approachable custom leather work from Horizon Creations—one-offs, odd requests, and useful pieces built from a rough idea.",
    currentPath: "/custom-work/",
    body: `${pageHero({ eyebrow: "Custom work", title: "Strange requests are usually the fun ones.", copy: "You do not need leatherworking vocabulary or a perfect design. Tell me what it should do and where the idea came from.", image: "custom-heresy", alt: customPieces[2].alt })}
      <section class="section"><div class="section-inner"><div class="section-heading" data-reveal><div><p class="eyebrow">How it works</p><h2>Simple enough to start.</h2></div><p>The details matter, but they do not all need to exist before the first message.</p></div><div class="simple-steps">${steps.map(([n,t,c]) => `<article class="simple-step"><span>${n}</span><h3>${t}</h3><p>${c}</p></article>`).join("")}</div></div></section>
      <section class="section custom-section"><div class="section-inner"><div class="section-heading" data-reveal><div><p class="eyebrow">Past custom work</p><h2>Different ideas. Same bench.</h2></div><p>These are examples, not a menu. They show color, tooling, finish, and how far a rough direction can travel.</p></div><div class="custom-gallery">${projects}</div></div></section>
      <section class="contact-band"><div class="section-inner" data-reveal><h2>Send the rough idea.</h2><p>Tell me what it needs to do, approximate size, the look you are after, and when you need it. We can solve the rest together.</p><div class="button-row"><a class="button button-primary" href="/contact/?piece=Custom%20leather%20piece">Start a custom piece</a></div></div></section>`,
  });
}

function workbenchPage() {
  const steps = processSteps.map((step) => `<article class="process-step" data-reveal><div class="process-step-media">${picture(step.image, step.alt, { sizes: "(max-width: 900px) 86vw, 45vw" })}</div><div class="process-step-copy"><span class="process-number">${step.number} / 06</span><p class="process-verb">${step.verb}</p><h3>${step.title}</h3><p>${step.copy}</p></div></article>`).join("");
  return layout({
    title: "Workbench",
    description: "Leatherwork process, tools, tests, dye, stamping, stitching, and finished bench work from Horizon Creations.",
    currentPath: "/workbench/",
    body: `${pageHero({ eyebrow: "The Living Workbench", title: "This is where the piece figures itself out.", copy: "Tools, tests, dye bottles, half-finished parts, and the small decisions that turn leather into something useful.", image: "process-tools", alt: "Leatherworking tools and pieces spread across the Horizon Creations bench" })}
      <section class="section workbench-section"><div class="section-inner"><div class="process-intro" data-reveal><p class="eyebrow">The making sequence</p><h2>Material. Pressure. Color. Time.</h2><p>There is no single perfect path through a build, but the work keeps returning to the same questions: what does the material want, what does the piece need to do, and what is worth doing again?</p></div><div class="process-list" data-reveal>${steps}</div></div></section>
      <section class="tools-section"><div class="section-inner tools-grid"><div class="tools-media" data-reveal>${picture(toolsLane.image, toolsLane.alt, { sizes: "(max-width: 900px) 94vw, 44vw" })}</div><div class="tools-copy" data-reveal><p class="eyebrow">Tools built for the job</p><h2>Sometimes the tool does not exist yet.</h2><p>${toolsLane.copy}</p><p>Those tests live beside the leatherwork, not above it. The finished piece is still the point.</p><a class="text-link" href="${site.cults3d}" target="_blank" rel="noreferrer">Browse stamp files</a></div></div></section>`,
  });
}

function aboutPage() {
  return layout({
    title: "About",
    description: "Meet Curtis and the real bench behind Horizon Creations handmade leather goods.",
    currentPath: "/about/",
    body: `${pageHero({ eyebrow: "About Horizon", title: "One maker, one busy bench.", copy: "Horizon Creations is a small Northern California leather shop built around useful pieces, strange ideas, and tools that earn their keep.", image: "process-bracelets", alt: "Finished hand-tooled bracelets from the Horizon Creations bench" })}
      <section class="section about-band"><div class="section-inner about-grid"><div data-reveal><p class="eyebrow">Curtis Malone</p><h2>I make the thing—and sometimes the tool that makes the thing.</h2></div><div class="about-copy" data-reveal><p>I’m Curtis. Horizon Creations is not a giant brand operation. It is me at the bench making leather goods, custom pieces, and whatever fixtures or stamp tools need to exist so the work can get done right.</p><p>I like work that gets used. Journals that pick up scratches. Pouches that soften where your hand grabs them. Custom pieces that started as a half-baked message and turned into something nobody else has.</p><p>Modern tools are part of the shop when they help. Printers, lasers, digital drawing, jigs, and repeatable patterns can make the work more accurate—but they never replace the material, the hand decisions, or the time at the bench.</p><p>Every piece picks up marks. That’s kind of the point.</p><a class="text-link" href="/custom-work/">See custom work</a></div></div></section>
      <section class="contact-band"><div class="section-inner" data-reveal><h2>Want to see what is moving now?</h2><p>The shop and workbench pages carry the latest pieces, process, and available work.</p><div class="button-row"><a class="button button-primary" href="/shop/">Shop the bench</a><a class="button" href="/workbench/">Visit the workbench</a></div></div></section>`,
  });
}

function contactPage() {
  const template = "Hi Curtis — I’m reaching out about [piece or idea]. I’d like it to: [what it needs to do]. Approximate size: [size]. Color or visual direction: [notes]. Timing: [when you need it].";
  return layout({
    title: "Contact",
    description: "Contact Horizon Creations about an available piece, made-to-order leatherwork, or a custom idea.",
    currentPath: "/contact/",
    body: `${pageHero({ eyebrow: "Contact", title: "Send the rough idea.", copy: "Tell me what the piece needs to do, what it should fit, and the part you care about most. We can work out the leather details from there.", image: "custom-turtle", alt: customPieces[1].alt })}
      <section class="section"><div class="section-inner contact-layout"><div class="contact-copy" data-reveal><p class="eyebrow">Best first message</p><h2>Keep it simple.</h2><p>A useful first note includes the job, approximate size, a color or visual direction, and timing. Photos and rough sketches are welcome.</p><div class="request-brief" data-contextual-brief hidden><p>You came here about <strong></strong>. I carried that context into the request template.</p></div><div class="brief-template">${template}</div><div class="button-row"><button class="button button-primary" type="button" data-copy-brief>Copy request brief</button></div></div><div class="contact-options" data-reveal><a class="contact-option" href="${site.facebook}" target="_blank" rel="noreferrer"><span><strong>Message Curtis on Facebook</strong><span>The fastest public message lane for shop and custom questions.</span></span></a><a class="contact-option" href="${site.instagram}" target="_blank" rel="noreferrer"><span><strong>Open Instagram</strong><span>Useful when you want to reference a bench photo or piece already posted there.</span></span></a><a class="contact-option" href="${site.facebookPage}" target="_blank" rel="noreferrer"><span><strong>Horizon Creations Page</strong><span>The public business-page lane for Horizon Creations.</span></span></a></div></div></section>
      <section class="section about-band"><div class="section-inner"><div class="section-heading" data-reveal><div><p class="eyebrow">What to send</p><h2>The useful details.</h2></div><p>You do not need every answer. These are simply the details that help me tell you what is possible.</p></div><div class="simple-steps"><article class="simple-step"><span>01</span><h3>The job</h3><p>What it holds, protects, fits, closes, carries, or survives.</p></article><article class="simple-step"><span>02</span><h3>Approximate size</h3><p>Exact measurements are helpful later; rough scale is enough to start.</p></article><article class="simple-step"><span>03</span><h3>Look and feel</h3><p>Color, tooling, references, or just “something darker and meaner.”</p></article><article class="simple-step"><span>04</span><h3>Timing</h3><p>If you have a date, say it early. Honest timing makes a better build.</p></article><article class="simple-step"><span>05</span><h3>Budget</h3><p>A working range keeps the first direction grounded.</p></article></div></div></section>`,
  });
}

function redirectPage(target, label) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="This Horizon Creations page moved to ${escapeHtml(label)}."><meta http-equiv="refresh" content="0;url=${target}"><link rel="canonical" href="${withOrigin(target)}"><title>${escapeHtml(label)} | ${site.name}</title></head><body><a class="skip-link" href="#main">Skip to content</a><main id="main"><p>This page moved to <a href="${target}">${escapeHtml(label)}</a>.</p></main></body></html>`;
}

function notFoundPage() {
  return layout({
    title: "Page not found",
    description: "That Horizon Creations page is not on the public bench.",
    currentPath: "/404.html",
    solidHeader: true,
    body: `<section class="contact-band" style="min-height:72svh;display:grid;align-items:center;padding-top:160px"><div class="section-inner"><p class="eyebrow" style="justify-content:center">404 / Off the bench</p><h1 style="max-width:12ch;margin:0 auto">That piece is not here.</h1><p>The link may be old, or the material may belong to a private shop lane.</p><div class="button-row"><a class="button button-primary" href="/shop/">Go to the shop</a><a class="button" href="/">Back home</a></div></div></section>`,
  });
}

async function write(relativePath, content) {
  const target = path.join(clientDir, relativePath);
  assertWithinRoot(target);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
}

async function listTopLevelPublicPaths() {
  const entries = await readdir(clientDir, { withFileTypes: true });
  return entries.map((entry) => entry.name).sort();
}

async function build() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(clientDir, { recursive: true });
  await mkdir(serverDir, { recursive: true });

  await mkdir(path.join(clientDir, "assets"), { recursive: true });
  await cp(path.join(sourceDir, "styles.css"), path.join(clientDir, "assets", "site.css"));
  await cp(path.join(sourceDir, "site.js"), path.join(clientDir, "assets", "site.js"));
  await cp(path.join(sourceDir, "brand"), path.join(clientDir, "brand"), { recursive: true });
  await cp(path.join(sourceDir, "images"), path.join(clientDir, "images"), { recursive: true });
  await cp(path.join(rootDir, "HorizonCreaion-Base-logo.jpg"), path.join(clientDir, "favicon.jpg"));

  const ogPath = path.join(sourceDir, "og.jpg");
  try {
    await stat(ogPath);
    await cp(ogPath, path.join(clientDir, "og.jpg"));
  } catch {
    // The social preview is generated and wired before final validation.
  }

  await write("index.html", homePage());
  await write("shop/index.html", shopPage());
  for (const product of products) {
    await write(`shop/${product.slug}/index.html`, productPage(product));
  }
  await write("custom-work/index.html", customWorkPage());
  await write("workbench/index.html", workbenchPage());
  await write("about/index.html", aboutPage());
  await write("contact/index.html", contactPage());
  await write("404.html", notFoundPage());

  await write("standard-pieces/index.html", redirectPage("/shop/", "Shop"));
  await write("custom-pieces/index.html", redirectPage("/custom-work/", "Custom Work"));
  await write("custom-orders/index.html", redirectPage("/custom-work/", "Custom Work"));

  const sitemapRoutes = [
    "/",
    "/shop/",
    ...products.map((product) => `/shop/${product.slug}/`),
    "/custom-work/",
    "/workbench/",
    "/about/",
    "/contact/",
  ];
  await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapRoutes.map((route) => `  <url><loc>${withOrigin(route)}</loc></url>`).join("\n")}\n</urlset>\n`);
  await write("robots.txt", `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`);
  await write("site.webmanifest", JSON.stringify({
    name: site.name,
    short_name: "Horizon",
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0d0b09",
    theme_color: "#15120f",
    icons: [{ src: "/favicon.jpg", sizes: "512x512", type: "image/jpeg", purpose: "any" }],
  }, null, 2));
  await write("CNAME", "horizoncreations.art\n");

  const worker = `const securityHeaders = {\n  "X-Content-Type-Options": "nosniff",\n  "Referrer-Policy": "strict-origin-when-cross-origin",\n  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",\n  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://www.facebook.com https://instagram.com"\n};\n\nexport default {\n  async fetch(request, env) {\n    const response = await env.ASSETS.fetch(request);\n    const headers = new Headers(response.headers);\n    for (const [name, value] of Object.entries(securityHeaders)) headers.set(name, value);\n    if (new URL(request.url).pathname.startsWith('/images/')) headers.set('Cache-Control', 'public, max-age=31536000, immutable');\n    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });\n  }\n};\n`;
  await writeFile(path.join(serverDir, "index.js"), worker, "utf8");

  await mkdir(path.join(distDir, ".openai"), { recursive: true });
  const hosting = JSON.parse(await readFile(path.join(rootDir, ".openai", "hosting.json"), "utf8"));
  const normalizedHosting = { project_id: hosting.project_id };
  await writeFile(path.join(distDir, ".openai", "hosting.json"), JSON.stringify(normalizedHosting, null, 2), "utf8");

  const allowedTopLevel = new Set([
    "404.html", "CNAME", "about", "assets", "brand", "contact", "custom-orders", "custom-pieces", "custom-work",
    "favicon.jpg", "images", "index.html", "og.jpg", "robots.txt", "shop", "site.webmanifest", "sitemap.xml",
    "standard-pieces", "workbench",
  ]);
  const actualTopLevel = await listTopLevelPublicPaths();
  const unexpected = actualTopLevel.filter((name) => !allowedTopLevel.has(name));
  if (unexpected.length) {
    throw new Error(`Unexpected public output: ${unexpected.join(", ")}`);
  }

  const publicFiles = await readdir(clientDir, { recursive: true });
  console.log(JSON.stringify({
    output: clientDir,
    pages: sitemapRoutes.length,
    publicFiles: publicFiles.length,
    publicTopLevel: actualTopLevel,
  }, null, 2));
}

await build();
