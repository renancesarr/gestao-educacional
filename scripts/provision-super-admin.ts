import { randomBytes, randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createSqlitePlatformIdentityStore } from '../src/database/sqlite-platform-identity-store.ts';
import { databasePool } from '../src/database/connection.ts';
import { postgresPlatformIdentityStore } from '../src/database/platform-identity-store.ts';
import { createPlatformIdentityService, createPlatformWebAuthn } from '../src/identity/index.ts';

const username = process.env.PLATFORM_ADMIN_USERNAME ?? '';
const recover = process.argv.includes('--recover');
if (!username.trim() || username.trim().length > 100) {
  throw new Error('Defina PLATFORM_ADMIN_USERNAME (1–100 caracteres).');
}

const useSqlite = (process.env.DATABASE_ADAPTER ?? 'sqlite') === 'sqlite';
const sqlitePath = resolve(process.env.SQLITE_DATABASE_PATH ?? './data/gestao-educacional.sqlite');
if (useSqlite) mkdirSync(dirname(sqlitePath), { recursive: true });
const database = useSqlite ? new DatabaseSync(sqlitePath) : undefined;
const pool = useSqlite ? undefined : databasePool();
try {
  const identity = createPlatformIdentityService({
    store: database ? createSqlitePlatformIdentityStore(database) : postgresPlatformIdentityStore(pool!),
    now: () => new Date(),
    newId: randomUUID,
    newActivationCode: () => randomBytes(32).toString('base64url'),
    newCeremonyToken: () => randomBytes(32).toString('base64url'),
    newLoginToken: () => randomBytes(32).toString('base64url'),
    newRecoveryCode: () => randomBytes(32).toString('base64url'),
    newToken: () => randomBytes(32).toString('base64url'),
    webAuthn: createPlatformWebAuthn({ origin: process.env.PUBLIC_ORIGIN ?? 'http://127.0.0.1:3000', rpName: 'Gestão acadêmica' }),
  });
  const provisioned = recover
    ? await identity.recover({ username: username.trim() })
    : await identity.provisionInitial({ username: username.trim() });
  console.log(`Conta SUPER_ADMIN ${recover ? 'reativada' : 'provisionada'}: ${provisioned.username}`);
  console.log(`Código de ativação de uso único: ${provisioned.activationCode}`);
  console.log('Entregue o código ao titular por um canal seguro. Ele expira em 30 minutos.');
} catch {
  console.error('Não foi possível provisionar. A conta pode já existir; nenhum código foi emitido.');
  process.exitCode = 1;
} finally { await pool?.end(); database?.close(); }
