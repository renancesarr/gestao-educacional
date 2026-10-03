import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import type { Pool } from 'pg';
import { transaction } from './connection.ts';

export async function migrate(pool: Pool): Promise<void> {
  const directory = new URL('../../migrations/', import.meta.url);
  const files = (await readdir(directory)).filter(name => /^\d{3}-[a-z-]+\.sql$/.test(name)).sort();
  await transaction(pool, async client => {
    await client.query('SELECT pg_advisory_xact_lock(73214901)');
    await client.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
    for (const name of files) {
      const sql = await readFile(new URL(name, directory), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await client.query<{ checksum: string }>('SELECT checksum FROM public.schema_migrations WHERE name=$1', [name]);
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum) throw new Error(`Migração já aplicada foi alterada: ${name}`);
        continue;
      }
      await client.query(sql);
      await client.query('INSERT INTO public.schema_migrations(name, checksum) VALUES ($1,$2)', [name, checksum]);
    }
  });
}
