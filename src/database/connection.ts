import { Pool, type PoolClient } from 'pg';

export function databasePool(connectionString = process.env.DATABASE_URL): Pool {
  if (!connectionString) throw new Error('Defina DATABASE_URL para usar PostgreSQL.');
  return new Pool({ connectionString, max: 10, connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30_000, statement_timeout: 10_000 });
}

export async function transaction<T>(pool: Pool, operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  let broken = false;
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch { broken = true; }
    throw error;
  } finally { client.release(broken); }
}
