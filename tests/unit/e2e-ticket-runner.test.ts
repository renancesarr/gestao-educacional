import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { hasExecutedTests, planTicketE2ERun } from '../../scripts/e2e-ticket-runner.mjs';

async function makeProject(status = 'ready-for-human') {
  const root = await mkdtemp(join(tmpdir(), 'ticket-e2e-'));
  const ticketId = 'consulta-alunos/02-busca-publica-limitada';
  const feature = 'consulta-alunos';
  const issue = '02-busca-publica-limitada';
  const ticketDirectory = join(root, '.scratch', feature, 'issues');
  const specDirectory = join(root, 'frontend', 'cypress', 'e2e', 'tickets', feature);
  await mkdir(ticketDirectory, { recursive: true });
  await mkdir(specDirectory, { recursive: true });
  await writeFile(join(ticketDirectory, `${issue}.md`), `# Public student search\n**Status:** ${status}\n`);
  await writeFile(join(specDirectory, `${issue}.cy.ts`), "it('searches public students', () => {});\n");
  return { root, ticketId, ticketDirectory, specDirectory };
}

test('plans exactly one headed Cypress spec and unique video/log destinations for a ticket', async () => {
  const project = await makeProject();
  try {
    const run = planTicketE2ERun(project.root, project.ticketId, new Date('2026-10-03T12:30:45.123Z'));

    assert.equal(run.ticketId, project.ticketId);
    assert.equal(run.specRelativePath, 'cypress/e2e/tickets/consulta-alunos/02-busca-publica-limitada.cy.ts');
    assert.deepEqual(run.cypressArgs.slice(0, 4), ['run', '--headed', '--browser', 'electron']);
    assert.deepEqual(run.cypressArgs.slice(4, 6), ['--spec', run.specRelativePath]);
    assert.match(run.cypressArgs.join(' '), /video=true/);
    assert.match(run.runDirectory, /logs\/e2e\/consulta-alunos\/02-busca-publica-limitada\/2026-10-03T12-30-45-123Z$/);
    assert.equal(run.videoDirectory.startsWith(run.runDirectory), true);
    assert.equal(run.logFile.startsWith(run.runDirectory), true);
  } finally {
    await rm(project.root, { recursive: true, force: true });
  }
});

test('rejects an invalid ticket identifier before creating a Cypress command', () => {
  assert.throws(() => planTicketE2ERun('/tmp', '../outside'), /formato.*ticket/i);
  assert.throws(() => planTicketE2ERun('/tmp', 'feature/../../outside'), /formato.*ticket/i);
});

test('rejects a ticket outside the active review or implementation states', async () => {
  const project = await makeProject('wontfix');
  try {
    assert.throws(() => planTicketE2ERun(project.root, project.ticketId), /wontfix/i);
  } finally {
    await rm(project.root, { recursive: true, force: true });
  }
});

test('rejects a ticket without its independent E2E spec instead of passing an empty run', async () => {
  const project = await makeProject();
  try {
    await rm(join(project.specDirectory, '02-busca-publica-limitada.cy.ts'));
    assert.throws(() => planTicketE2ERun(project.root, project.ticketId), /spec.*não existe/i);
  } finally {
    await rm(project.root, { recursive: true, force: true });
  }
});

test('rejects a Cypress run that discovers no tests', () => {
  assert.equal(hasExecutedTests('│ Tests:        1 │'), true);
  assert.equal(hasExecutedTests('│ Tests:        0 │'), false);
  assert.equal(hasExecutedTests('Cypress failed before discovery'), false);
});
