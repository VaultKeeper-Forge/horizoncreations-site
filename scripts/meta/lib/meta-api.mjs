import { metaConfig, assertMetaCredentials, getGraphApiBaseUrl } from "./meta-config.mjs";

function buildGraphUrl(graphPath, params = {}) {
  const url = new URL(`${getGraphApiBaseUrl()}${graphPath}`);

  url.searchParams.set("access_token", metaConfig.accessToken);

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url;
}

async function graphRequest(graphPath, params) {
  const url = buildGraphUrl(graphPath, params);
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json.error) {
    const errorMessage = json?.error?.message || response.statusText || "Meta API request failed.";
    throw new Error(`${errorMessage} (${url.pathname})`);
  }

  return json;
}

function pickLargestFacebookImage(images = []) {
  return [...images].sort((left, right) => (right.height || 0) * (right.width || 0) - (left.height || 0) * (left.width || 0))[0];
}

export async function fetchFacebookPagePhotos(limit = metaConfig.importLimit) {
  assertMetaCredentials("facebook-page");

  const json = await graphRequest(`/${metaConfig.facebookPageId}/photos`, {
    fields: "id,name,link,created_time,images",
    type: "uploaded",
    limit,
  });

  return (json.data || []).map((photo) => {
    const largestImage = pickLargestFacebookImage(photo.images || []);

    return {
      sourceId: photo.id,
      caption: photo.name || "",
      permalink: photo.link || "",
      timestamp: photo.created_time || "",
      mediaType: "IMAGE",
      mediaUrl: largestImage?.source || "",
      thumbnailUrl: (photo.images || [])[photo.images.length - 1]?.source || largestImage?.source || "",
      children: [],
    };
  });
}

function normalizeInstagramChildren(children = []) {
  return children.map((child) => ({
    sourceId: child.id,
    mediaType: child.media_type || "IMAGE",
    mediaUrl: child.media_url || child.thumbnail_url || "",
    thumbnailUrl: child.thumbnail_url || child.media_url || "",
    permalink: child.permalink || "",
  }));
}

export async function fetchInstagramBusinessMedia(limit = metaConfig.importLimit) {
  assertMetaCredentials("instagram-business");

  const json = await graphRequest(`/${metaConfig.instagramBusinessAccountId}/media`, {
    fields:
      "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,children{media_type,media_url,thumbnail_url,id,permalink}",
    limit,
  });

  return (json.data || []).map((item) => {
    const children = normalizeInstagramChildren(item.children?.data || []);
    const primaryChild = children[0];

    return {
      sourceId: item.id,
      caption: item.caption || "",
      permalink: item.permalink || primaryChild?.permalink || "",
      timestamp: item.timestamp || "",
      mediaType: item.media_type || "IMAGE",
      mediaUrl: item.media_url || item.thumbnail_url || primaryChild?.mediaUrl || "",
      thumbnailUrl: item.thumbnail_url || item.media_url || primaryChild?.thumbnailUrl || "",
      children,
    };
  });
}
