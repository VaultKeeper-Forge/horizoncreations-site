import { forbidden } from "../domain/errors.js";
import type { CommerceConfig } from "../config/config.js";

export interface OwnerPrincipal {
  subject: string;
  role: "owner";
}

export function requireOwner(headers: Record<string, string | string[] | undefined>, config: CommerceConfig): OwnerPrincipal {
  if (config.OWNER_AUTH_MODE !== "local-test" || config.NODE_ENV === "production") {
    throw forbidden("OAUTH_REQUIRED", "This owner endpoint requires production OAuth authentication.");
  }
  const subject = headers["x-malone-owner"];
  if (subject !== "curtis-owner-test") throw forbidden("OWNER_AUTH_REQUIRED", "A local owner test identity is required for this pre-connection endpoint.");
  return { subject, role: "owner" };
}
