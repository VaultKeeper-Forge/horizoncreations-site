import { createHmac, timingSafeEqual } from "node:crypto";
import { forbidden } from "../../../domain/errors.js";

/** Verify the raw Shopify webhook payload before it can enter sync processing. */
export function verifyShopifyWebhook(rawBody: Buffer, suppliedSignature: string | undefined, secret: string | undefined): void {
  if (!secret || !suppliedSignature) {
    throw forbidden("SHOPIFY_WEBHOOK_UNVERIFIED", "A configured webhook secret and HMAC header are required.");
  }
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(suppliedSignature);
  if (expectedBytes.length !== suppliedBytes.length || !timingSafeEqual(expectedBytes, suppliedBytes)) {
    throw forbidden("SHOPIFY_WEBHOOK_UNVERIFIED", "The webhook HMAC did not match the raw request payload.");
  }
}

/** A tenant-scoped durable uniqueness constraint backs this same contract in PostgreSQL. */
export class WebhookReplayLedger {
  private readonly seen = new Set<string>();

  accept(tenantId: string, providerEventId: string): void {
    const key = `${tenantId}:${providerEventId}`;
    if (this.seen.has(key)) throw forbidden("WEBHOOK_REPLAY", "This provider event has already been accepted.", { providerEventId });
    this.seen.add(key);
  }
}
