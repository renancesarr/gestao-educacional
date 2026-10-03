import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createSqlitePlatformIdentityStore } from '../../src/database/sqlite-platform-identity-store.ts';
import type { PlatformIdentityStore } from '../../src/identity/index.ts';

test('SQLite platform identity: provisions one global admin without storing MVP audit events', async () => {
  const db = new DatabaseSync(':memory:');
  const store: PlatformIdentityStore = createSqlitePlatformIdentityStore(db);
  const value = {
    account: { id: 'admin-1', username: 'global', active: false, createdAt: '2026-09-30T12:00:00.000Z' },
    activation: { adminId: 'admin-1', codeHash: 'hash', expiresAt: '2026-09-30T12:30:00.000Z', usedAt: null },
  };

  assert.equal(await store.createFirstAdmin(value), 'created');
  assert.equal(await store.createFirstAdmin({ ...value, account: { ...value.account, id: 'admin-2' } }), 'already-exists');
  assert.deepEqual(await store.pendingActivation('global', 'hash'), { account: value.account, activation: value.activation });
  assert.equal((db.prepare('SELECT count(*) AS count FROM audit_platform_events').get() as { count: number }).count, 0);
  db.close();
});
