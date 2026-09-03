import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(rootDir, "dist", "client");
const failures = [];

function fail(message) {
  failures.push(message);
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function relative(file) {
  return path.relative(clientDir, file).replaceAll("\\", "/");
}

function resolveInternal(urlValue) {
  const clean = urlValue.split("#")[0].split("?")[0];
  if (!clean.startsWith("/") || clean.startsWith("//")) return null;
  if (clean === "/") return path.join(clientDir, "index.html");
  const resolved = path.join(clientDir, clean);
  return path.extname(resolved) ? resolved : path.join(resolved, "index.html");
}

const expectedPages = [
  "index.html",
  "shop/index.html",
  "shop/heresy-journal/index.html",
  "shop/everyday-carry-pouch/index.html",
  "custom-work/index.html",
  "workbench/index.html",
  "about/index.html",
  "contact/index.html",
  "404.html",
];

const allFiles = await walk(clientDir);
const allRelative = new Set(allFiles.map(relative));

for (const page of expectedPages) {
  if (!allRelative.has(page)) fail(`Missing expected page: ${page}`);
}

const forbiddenTopLevel = [
  ".env.example",
  "content",
  "Cults3D",
  "docs",
  "horizon-apps",
  "package.json",
  "scripts",
  "vault",
  "workbench/index.html.old",
];
for (const name of forbiddenTopLevel) {
  if (allRelative.has(name) || [...allRelative].some((file) => file.startsWith(`${name}/`))) {
    fail(`Forbidden public path present: ${name}`);
  }
}

const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));
const forbiddenPublicIdentity = [
  "Vault Compiler",
  "follower count",
  "page hits",
  "tip jar",
  "Discord",
  "built with AI",
];

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const fileName = relative(file);
  for (const phrase of forbiddenPublicIdentity) {
    if (html.toLowerCase().includes(phrase.toLowerCase())) {
      fail(`${fileName} contains forbidden public identity text: ${phrase}`);
    }
  }

  if (!html.includes('<meta name="description"')) fail(`${fileName} missing meta description`);
  if (!html.includes('<link rel="canonical"')) fail(`${fileName} missing canonical URL`);
  if (!html.includes('class="skip-link"')) fail(`${fileName} missing skip link`);

  if (expectedPages.includes(fileName)) {
    const maloneCreditLinks = [...html.matchAll(/<a class="footer-credit" href="https:\/\/www\.maloneintegratedtech\.com\/"/g)].length;
    if (maloneCreditLinks !== 1) fail(`${fileName} must contain exactly one approved Malone footer credit, found ${maloneCreditLinks}`);
  }

  const imageTags = [...html.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
  for (const tag of imageTags) {
    for (const attr of ["alt=", "width=", "height=", "loading=", "decoding="]) {
      if (!tag.includes(attr)) fail(`${fileName} image missing ${attr}: ${tag.slice(0, 120)}`);
    }
  }

  const urls = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const urlValue of urls) {
    const target = resolveInternal(urlValue);
    if (!target) continue;
    try {
      const info = await stat(target);
      if (!info.isFile()) fail(`${fileName} internal target is not a file: ${urlValue}`);
    } catch {
      fail(`${fileName} missing internal target: ${urlValue}`);
    }
  }
}

const home = await readFile(path.join(clientDir, "index.html"), "utf8");
for (const soldName of ["Banzai Journal", "Turtles Journal", "Green Mushroom Journal"]) {
  const position = home.indexOf(soldName);
  if (position < 0) fail(`Homepage missing sold archive piece: ${soldName}`);
  const context = home.slice(Math.max(0, position - 600), position + 600);
  if (!context.includes("SOLD")) fail(`${soldName} is not marked SOLD near its homepage listing`);
}
if (!home.includes("Heresy Journal") || !home.includes("AVAILABLE")) fail("Homepage missing confirmed AVAILABLE Heresy Journal");
if (!home.includes("Everyday Carry Pouch") || !home.includes("MADE TO ORDER")) fail("Homepage missing MADE TO ORDER pouch");

for (const productPage of ["shop/heresy-journal/index.html", "shop/everyday-carry-pouch/index.html"]) {
  const html = await readFile(path.join(clientDir, productPage), "utf8");
  if (!html.includes('data-commerce-mode="disabled"')) fail(`${productPage} must build with public commerce disabled`);
  if (!/<button[^>]*data-commerce-add[^>]*\sdisabled(?:\s|>|=)/.test(html)) fail(`${productPage} has an enabled public commerce control`);
  if (html.includes("Add to mock cart") || html.includes("http://127.0.0.1:8787")) fail(`${productPage} contains local mock checkout details in the public artifact`);
}
for (const asset of ["assets/commerce-client.js", "assets/commerce-client.css"]) {
  if (!allRelative.has(asset)) fail(`Missing commerce safety asset: ${asset}`);
}

const primaryNavMatch = home.match(/<nav class="primary-nav"[\s\S]*?<\/nav>/);
if (!primaryNavMatch) fail("Homepage missing primary navigation");
else {
  const navLinks = [...primaryNavMatch[0].matchAll(/<a\b/g)].length;
  if (navLinks !== 5) fail(`Primary navigation must contain 5 links, found ${navLinks}`);
}

const sizeBudgets = {
  "index.html": 100_000,
  "assets/site.css": 90_000,
  "assets/site.js": 20_000,
};
for (const [file, maxBytes] of Object.entries(sizeBudgets)) {
  const info = await stat(path.join(clientDir, file));
  if (info.size > maxBytes) fail(`${file} exceeds ${maxBytes} byte budget (${info.size})`);
}

for (const file of allFiles.filter((item) => /\.(webp|jpg|png)$/i.test(item))) {
  const info = await stat(file);
  if (info.size > 600_000) fail(`Public image exceeds 600 KB: ${relative(file)} (${info.size})`);
}

if (!allRelative.has("robots.txt")) fail("robots.txt missing");
if (!allRelative.has("sitemap.xml")) fail("sitemap.xml missing");
if (!allRelative.has("site.webmanifest")) fail("site.webmanifest missing");

if (failures.length) {
  console.error(failures.map((message) => `- ${message}`).join("\n"));
  process.exit(1);
}

const totalBytes = (await Promise.all(allFiles.map(async (file) => (await stat(file)).size))).reduce((sum, size) => sum + size, 0);
console.log(JSON.stringify({
  state: "VERIFIED_COMPLETE",
  pages: htmlFiles.length,
  publicFiles: allFiles.length,
  publicBytes: totalBytes,
  forbiddenPaths: 0,
  internalLinkFailures: 0,
  inventoryTruth: {
    available: ["Heresy Journal"],
    madeToOrder: ["Everyday Carry Pouch"],
    sold: ["Banzai Journal", "Turtles Journal", "Green Mushroom Journal"],
  },
}, null, 2));
