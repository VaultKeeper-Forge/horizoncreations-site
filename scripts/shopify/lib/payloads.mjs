function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paragraphize(text) {
  return String(text)
    .split(/\r?\n\r?\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => `<p>${escapeHtml(chunk)}</p>`)
    .join("");
}

function buildMediaPlan(product) {
  return product.data.images.map((image, index) => ({
    position: index,
    source: image.path,
    alt: image.alt || `${product.data.title} image ${index + 1}`,
    role: image.role || (index === 0 ? "hero" : "detail"),
    uploadStrategy: /^https?:\/\//i.test(image.path) ? "remote-url" : "local-content-reference",
  }));
}

function buildRemoteMediaInputs(mediaPlan) {
  return mediaPlan
    .filter((media) => media.uploadStrategy === "remote-url")
    .map((media) => ({
      alt: media.alt,
      mediaContentType: "IMAGE",
      originalSource: media.source,
    }));
}

export function buildProductPayload(product) {
  const mediaPlan = buildMediaPlan(product);

  return {
    staging: {
      slug: product.slug,
      kind: product.data.kind,
      source: product.data.source,
      publish: product.data.publish,
    },
    productCreateInput: {
      title: product.data.title,
      descriptionHtml: paragraphize(product.data.description),
      productType: product.data.category,
      vendor: "Horizon Creations",
      tags: product.data.tags,
      status: product.data.publish ? "ACTIVE" : "DRAFT",
    },
    initialVariant: {
      price: product.data.price,
      inventoryQuantity: product.data.quantity,
      sku: product.data.sku || "",
    },
    mediaPlan,
    remoteMediaInputs: buildRemoteMediaInputs(mediaPlan),
  };
}

export function buildProductCreateOperation(product) {
  const payload = buildProductPayload(product);

  return {
    mutation: `mutation CreateDraftProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
  productCreate(product: $product, media: $media) {
    product {
      id
      title
      status
      handle
    }
    userErrors {
      field
      message
    }
  }
}`,
    variables: {
      product: payload.productCreateInput,
      media: payload.remoteMediaInputs,
    },
    payload,
  };
}

export function buildFutureSyncPlan(product) {
  return {
    action: product.data.shopify?.productId ? "update-existing-product" : "create-new-product",
    recommendedMutation: product.data.shopify?.productId ? "productSet" : "productCreate",
    shopifyProductId: product.data.shopify?.productId || "",
    nextSyncPayload: {
      title: product.data.title,
      descriptionHtml: paragraphize(product.data.description),
      productType: product.data.category,
      tags: product.data.tags,
      publish: product.data.publish,
      quantity: product.data.quantity,
      sku: product.data.sku || "",
    },
  };
}
