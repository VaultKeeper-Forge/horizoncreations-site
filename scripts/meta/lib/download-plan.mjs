import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const importRootDir = path.join(rootDir, "tmp", "meta-imports");

function toSafeName(value) {
  return String(value).replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function inferExtensionFromUrl(url) {
  const match = /\.([a-z0-9]{3,4})(?:[?#]|$)/i.exec(url || "");
  return match ? `.${match[1].toLowerCase()}` : ".jpg";
}

function listMediaVariants(item) {
  if (Array.isArray(item.children) && item.children.length > 0) {
    return item.children
      .filter((child) => child.mediaUrl)
      .map((child, index) => ({
        url: child.mediaUrl,
        altId: child.sourceId || `${item.sourceId}-child-${index + 1}`,
        mediaType: child.mediaType || "IMAGE",
      }));
  }

  if (!item.mediaUrl) {
    return [];
  }

  return [
    {
      url: item.mediaUrl,
      altId: item.sourceId,
      mediaType: item.mediaType || "IMAGE",
    },
  ];
}

export function buildApprovedDownloadPlan(manifests) {
  const plan = [];

  for (const manifest of manifests) {
    for (const item of manifest.data.items || []) {
      if (!item.workflow?.approvedForDownload) {
        continue;
      }

      const mediaVariants = listMediaVariants(item);
      const itemDir = path.join(importRootDir, toSafeName(manifest.data.platform), toSafeName(item.sourceId));

      plan.push({
        platform: manifest.data.platform,
        sourceId: item.sourceId,
        caption: item.caption || "",
        permalink: item.permalink || "",
        timestamp: item.timestamp || "",
        itemDir,
        metadataPath: path.join(itemDir, "item.json"),
        mediaFiles: mediaVariants.map((variant, index) => ({
          url: variant.url,
          mediaType: variant.mediaType,
          destinationPath: path.join(itemDir, `original-${String(index + 1).padStart(2, "0")}${inferExtensionFromUrl(variant.url)}`),
        })),
      });
    }
  }

  return plan;
}

export async function downloadApprovedItem(planItem) {
  await mkdir(planItem.itemDir, { recursive: true });

  for (const mediaFile of planItem.mediaFiles) {
    const response = await fetch(mediaFile.url);

    if (!response.ok) {
      throw new Error(`Failed to download media from ${mediaFile.url} (${response.status}).`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(mediaFile.destinationPath, buffer);
  }

  await writeFile(
    planItem.metadataPath,
    `${JSON.stringify(
      {
        platform: planItem.platform,
        sourceId: planItem.sourceId,
        caption: planItem.caption,
        permalink: planItem.permalink,
        timestamp: planItem.timestamp,
        downloadedAt: new Date().toISOString(),
        files: planItem.mediaFiles.map((mediaFile) => path.basename(mediaFile.destinationPath)),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}
