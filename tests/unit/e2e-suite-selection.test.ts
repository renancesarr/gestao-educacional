import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { planTicketE2ERun } from '../../scripts/e2e-ticket-runner.mjs';

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('the broad E2E command selects only the institutional platform journey', async () => {
  const packageJson = JSON.parse(await readFile(join(repositoryRoot, 'frontend/package.json'), 'utf8'));
  const command = packageJson.scripts['test:e2e'];

  assert.match(command, /--spec\s+cypress\/e2e\/platform-journey\.cy\.ts/);
});

test('the ticket E2E runner selects its requested spec regardless of the broad command', () => {
  const run = planTicketE2ERun(repositoryRoot, 'consulta-alunos/02-busca-publica-limitada');

  assert.deepEqual(run.cypressArgs.slice(4, 6), [
    '--spec',
    'cypress/e2e/tickets/consulta-alunos/02-busca-publica-limitada.cy.ts',
  ]);
  assert.match(run.cypressArgs.join(' '), /--headed.*--browser electron/);
});
