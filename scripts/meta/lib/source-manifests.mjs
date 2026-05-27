import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const socialIntakeDir = path.join(rootDir, "content", "social-intake");
const candidatesDir = path.join(socialIntakeDir, "candidates");
const sourceProfilesDir = path.join(socialIntakeDir, "source-profiles");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function withDefaultWorkflow(existingWorkflow = {}) {
  return {
    reviewed: false,
    approvedForDownload: false,
    approvedForSiteUse: false,
    targetSection: "",
    targetSlugHint: "",
    notes: "",
    ...clone(existingWorkflow),
  };
}

export function getCandidatesDirectory() {
  return candidatesDir;
}

export function getSocialIntakeDirectory() {
  return socialIntakeDir;
}

export async function ensureSocialIntakeDirectories() {
  await mkdir(candidatesDir, { recursive: true });
  await mkdir(sourceProfilesDir, { recursive: true });
}

async function readJsonIfPresent(filePath) {
  try {
    const source = await readFile(filePath, "utf8");
    return JSON.parse(source);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function loadSourceProfiles() {
  const dirEntries = await readdir(sourceProfilesDir, { withFileTypes: true });
  const files = dirEntries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"));
  const profiles = [];

  for (const file of files) {
    const filePath = path.join(sourceProfilesDir, file.name);
    const data = await readJsonIfPresent(filePath);

    if (data) {
      profiles.push({ filePath, data });
    }
  }

  return profiles.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

export function getManifestFilePath(platform) {
  return path.join(candidatesDir, `${platform}.json`);
}

export async function loadCandidateManifest(platform) {
  return readJsonIfPresent(getManifestFilePath(platform));
}

export async function loadAllCandidateManifests() {
  const dirEntries = await readdir(candidatesDir, { withFileTypes: true }).catch((error) => {
    if (error?.code === "ENOENT") {
      return [];
    }

    throw error;
  });

  const manifests = [];

  for (const file of dirEntries.filter((entry) => entry.isFile() && entry.name.endsWith(".json"))) {
    const filePath = path.join(candidatesDir, file.name);
    const data = await readJsonIfPresent(filePath);

    if (data) {
      manifests.push({ filePath, data });
    }
  }

  return manifests.sort((a, b) => a.filePath.localeCompare(b.filePath));
}

export async function writeCandidateManifest(platform, payload) {
  await ensureSocialIntakeDirectories();

  const existing = await loadCandidateManifest(platform);
  const existingWorkflowById = new Map(
    (existing?.items || []).map((item) => [item.sourceId, item.workflow || {}]),
  );

  const nextManifest = {
    platform,
    generatedAt: new Date().toISOString(),
    sourceLabel: payload.sourceLabel,
    publicUrl: payload.publicUrl,
    sourceAccountId: payload.sourceAccountId,
    itemCount: payload.items.length,
    items: payload.items.map((item) => ({
      ...item,
      workflow: withDefaultWorkflow(existingWorkflowById.get(item.sourceId)),
    })),
  };

  const targetPath = getManifestFilePath(platform);
  await writeFile(targetPath, `${JSON.stringify(nextManifest, null, 2)}\n`, "utf8");

  return targetPath;
}
