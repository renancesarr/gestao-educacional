import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { createSqliteEmecCatalogStore } from '../../src/database/sqlite-emec-catalog-store.ts';
import { createEmecCatalogService } from '../../src/public_catalog/emec-catalog.ts';

const fixturePath = fileURLToPath(new URL('../fixtures/catalog-listing.sqlite', import.meta.url));

test('SQLite somente leitura lista as IES e ofertas do fixture sem importar ou cadastrar dados', async () => {
  const database = new DatabaseSync(fixturePath, { readOnly: true });
  try {
    const catalog = createEmecCatalogService({ store: createSqliteEmecCatalogStore(database), newId: () => 'unused-read-only-test-id' });
    database.exec('PRAGMA query_only = ON');

    const current = await catalog.current();
    assert.equal(current.institutions.length, 27);
    assert.equal(new Set(current.institutions.map(value => value.state)).size, 27);
    assert.equal(current.courses.length, 100);
    const institutionCodes = new Set(current.institutions.map(value => value.sourceId));
    assert.ok(current.courses.every(value => institutionCodes.has(value.institutionCode)));
  } finally {
    database.close();
  }
});

test('SQLite consulta por nome/localidade e por curso/localidade com páginas sem repetir ofertas', async () => {
  const database = new DatabaseSync(fixturePath, { readOnly: true });
  try {
    const catalog = createEmecCatalogService({ store: createSqliteEmecCatalogStore(database), newId: () => 'unused-read-only-test-id' });
    database.exec('PRAGMA query_only = ON');

    const institutionResult = await catalog.search({ accountId: 'fixture-reader', role: 'SUPER_ADMIN' },
      { name: 'Federal de Mato Grosso', municipality: 'Cuiabá', state: 'mt' }, { page: 1, pageSize: 2 });
    assert.equal(institutionResult.totalInstitutions, 1);
    assert.equal(institutionResult.institutions[0]?.name, 'UNIVERSIDADE FEDERAL DE MATO GROSSO');
    assert.equal(institutionResult.institutions[0]?.state, 'MT');

    const firstPage = await catalog.search({ accountId: 'fixture-reader', role: 'SUPER_ADMIN' },
      { name: 'Mato Grosso', course: 'Administração', municipality: 'Cuiabá', state: 'MT' }, { page: 1, pageSize: 2 });
    const secondPage = await catalog.search({ accountId: 'fixture-reader', role: 'SUPER_ADMIN' },
      { name: 'Mato Grosso', course: 'Administração', municipality: 'Cuiabá', state: 'MT' }, { page: 2, pageSize: 2 });
    assert.equal(firstPage.totalInstitutions, 1);
    assert.ok(firstPage.totalCourses > 2);
    assert.equal(firstPage.institutions[0]?.sourceId, '1');
    assert.equal(firstPage.courses.length, 2);
    assert.ok(firstPage.courses.every(value => value.name.includes('ADMINISTRAÇÃO') && value.municipality === 'Cuiabá' && value.state === 'MT'));
    const firstKeys = new Set(firstPage.courses.map(value => `${value.sourceId}|${value.municipalityCode}|${value.state}`));
    assert.ok(secondPage.courses.every(value => !firstKeys.has(`${value.sourceId}|${value.municipalityCode}|${value.state}`)));
    assert.equal(firstPage.totalPages, Math.ceil(firstPage.totalCourses / 2));
  } finally {
    database.close();
  }
});
