import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createPublicCatalogService } from '../../src/public_catalog/index.ts';
import { createSqlitePublicCatalogStore } from '../../src/database/sqlite-public-catalog-store.ts';

const operator = { accountId: 'fixture-reader', role: 'SUPER_ADMIN' as const };
const fixturePath = fileURLToPath(new URL('../fixtures/catalog-listing.sqlite', import.meta.url));

test('SQLite somente leitura lista a escola selecionada por município e UF do fixture', async () => {
  const database = new DatabaseSync(fixturePath, { readOnly: true });
  try {
    const catalog = createPublicCatalogService({
      store: createSqlitePublicCatalogStore(database),
      now: () => new Date('2026-10-03T00:00:00.000Z'),
      newId: () => 'unused-read-only-test-id',
    });
    database.exec('PRAGMA query_only = ON');

    const schools = await catalog.searchInepSchools(operator, { municipality: 'Porto Velho', state: 'RO' });
    assert.equal(schools.length, 1);
    assert.equal(schools[0]?.municipality?.label, 'Porto Velho');
    assert.equal(schools[0]?.state?.code, 'RO');
    assert.ok((await catalog.searchInepSchools(operator, { name: 'ESCOLA' })).length > 0);
  } finally {
    database.close();
  }
});
