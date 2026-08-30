import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "dist", "client");
const port = Number(process.env.HORIZON_V2_PORT || 4173);

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const candidate = path.resolve(publicDir, `.${decoded}`);
  const relative = path.relative(publicDir, candidate);
  if (relative.startsWith("..") || path.isAbsolute(relative)) return null;
  return candidate;
}

async function resolveFile(urlPath) {
  let candidate = safePath(urlPath);
  if (!candidate) return null;
  try {
    const info = await stat(candidate);
    if (info.isDirectory()) candidate = path.join(candidate, "index.html");
  } catch {
    if (!path.extname(candidate)) candidate = path.join(candidate, "index.html");
  }
  try {
    const info = await stat(candidate);
    return info.isFile() ? candidate : null;
  } catch {
    return null;
  }
}

const server = http.createServer(async (request, response) => {
  const filePath = await resolveFile(request.url || "/");
  const target = filePath || path.join(publicDir, "404.html");
  const body = await readFile(target);
  response.writeHead(filePath ? 200 : 404, {
    "Content-Type": types[path.extname(target).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Horizon V2 preview: http://127.0.0.1:${port}`);
});
