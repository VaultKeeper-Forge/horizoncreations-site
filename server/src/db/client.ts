import { Pool, type PoolClient } from "pg";

export interface TenantScopedDatabase {
  withTenantTransaction<T>(tenantId: string, work: (client: PoolClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/**
 * The application repository sets the tenant before every query. PostgreSQL RLS
 * policies in 0001_control_plane.sql reject cross-tenant rows as a second line
 * of defense. The disconnected mock does not require a database connection.
 */
export function createTenantScopedDatabase(connectionString: string): TenantScopedDatabase {
  const pool = new Pool({ connectionString, max: 8, application_name: "malone-commerce-control" });
  return {
    async withTenantTransaction<T>(tenantId: string, work: (client: PoolClient) => Promise<T>): Promise<T> {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
        const result = await work(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}
