import { z } from "zod";

const configSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  DATABASE_URL: z.string().min(1).default("postgres://malone_commerce:local-only@127.0.0.1:5432/malone_commerce"),
  COMMERCE_PROVIDER: z.literal("mock").default("mock"),
  SHOPIFY_CONNECTION_GATE: z.literal("closed").default("closed"),
  PUBLIC_CHECKOUT: z.literal("off").default("off"),
  STOREFRONT_ORIGINS: z.string().default("http://127.0.0.1:4173,https://horizoncreations.art"),
  OWNER_AUTH_MODE: z.enum(["local-test", "oauth-required"]).default("local-test"),
  SHOPIFY_STORE_DOMAIN: z.string().optional(),
  SHOPIFY_CLIENT_ID: z.string().optional(),
  SHOPIFY_CLIENT_SECRET: z.string().optional(),
  SHOPIFY_API_VERSION: z.literal("2026-07").default("2026-07"),
  SHOPIFY_STOREFRONT_TOKEN: z.string().optional(),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
});

export type CommerceConfig = ReturnType<typeof readConfig>;

export function readConfig(environment: NodeJS.ProcessEnv = process.env) {
  const parsed = configSchema.parse(environment);
  if (parsed.NODE_ENV === "production" && parsed.OWNER_AUTH_MODE === "local-test") {
    throw new Error("OWNER_AUTH_MODE=local-test is forbidden in production.");
  }
  return {
    ...parsed,
    storefrontOrigins: parsed.STOREFRONT_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
  };
}
