import { logger } from "../shopify/lib/logger.mjs";
import { fetchFacebookPagePhotos, fetchInstagramBusinessMedia } from "./lib/meta-api.mjs";
import { getMissingMetaCredentials, metaConfig } from "./lib/meta-config.mjs";
import { ensureSocialIntakeDirectories, loadSourceProfiles, writeCandidateManifest } from "./lib/source-manifests.mjs";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const selectedPlatforms = args.has("--platform=facebook")
  ? ["facebook-page"]
  : args.has("--platform=instagram")
    ? ["instagram-business"]
    : ["facebook-page", "instagram-business"];

const loaders = {
  "facebook-page": fetchFacebookPagePhotos,
  "instagram-business": fetchInstagramBusinessMedia,
};

function findSourceProfile(profiles, platform) {
  return profiles.find((profile) => profile.data.platform === platform)?.data;
}

logger.step(`Running Meta media discovery${dryRun ? " (dry run)" : ""}.`);

const sourceProfiles = await loadSourceProfiles();
await ensureSocialIntakeDirectories();

for (const platform of selectedPlatforms) {
  const missing = getMissingMetaCredentials(platform);

  if (missing.length) {
    if (dryRun) {
      logger.warn(`${platform} would be skipped because credentials are missing: ${missing.join(", ")}`);
      continue;
    }

    logger.error(`${platform} cannot run because credentials are missing: ${missing.join(", ")}`);
    process.exitCode = 1;
    continue;
  }

  const sourceProfile = findSourceProfile(sourceProfiles, platform);
  const items = await loaders[platform](metaConfig.importLimit);

  logger.info(`${platform} returned ${items.length} items.`);

  if (dryRun) {
    continue;
  }

  const targetPath = await writeCandidateManifest(platform, {
    sourceLabel: sourceProfile?.label || platform,
    publicUrl: sourceProfile?.publicUrl || "",
    sourceAccountId:
      platform === "facebook-page" ? metaConfig.facebookPageId : metaConfig.instagramBusinessAccountId,
    items,
  });

  logger.info(`Wrote ${platform} candidate manifest to ${targetPath}`);
}
