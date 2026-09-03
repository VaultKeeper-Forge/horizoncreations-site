import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";
import { readConfig } from "../config/config.js";

const config = readConfig();
const migrationsDir = resolve(process.cwd(), "migrations");
const migrations = (await readdir(migrationsDir)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
const client = new Client({ connectionString: config.DATABASE_URL, application_name: "malone-commerce-migrate" });

await client.connect();
try {
  await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
  for (const migration of migrations) {
    const exists = await client.query("SELECT 1 FROM schema_migrations WHERE id = $1", [migration]);
    if (exists.rowCount) continue;
    await client.query("BEGIN");
    try {
      await client.query(await readFile(resolve(migrationsDir, migration), "utf8"));
      await client.query("INSERT INTO schema_migrations (id) VALUES ($1)", [migration]);
      await client.query("COMMIT");
      console.log(JSON.stringify({ migration, result: "applied" }));
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.end();
}
