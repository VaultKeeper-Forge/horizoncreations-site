import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

export function requireEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
