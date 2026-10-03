import { existsSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ticketIdPattern = /^([a-z0-9]+(?:-[a-z0-9]+)*)\/([0-9]{2}-[a-z0-9]+(?:-[a-z0-9]+)*)$/;

function timestampForPath(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('Data da execução E2E inválida.');
  }
  return date.toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

export function hasExecutedTests(output) {
  const match = output.match(/│\s*Tests:\s*(\d+)\s*│/);
  return match !== null && Number(match[1]) > 0;
}

export function planTicketE2ERun(repositoryRoot, ticketId, startedAt = new Date()) {
  const match = typeof ticketId === 'string' ? ticketIdPattern.exec(ticketId) : null;
  if (!match) throw new Error('Formato inválido de ticket; use feature/NN-slug.');

  const [, feature, issue] = match;
  const ticketFile = join(repositoryRoot, '.scratch', feature, 'issues', `${issue}.md`);
  if (!existsSync(ticketFile)) throw new Error(`Ticket não existe: ${ticketId}.`);

  const ticketText = readFileSync(ticketFile, 'utf8');
  const status = ticketText.match(/^\*\*Status:\*\*\s+([a-z-]+)\s*$/m)?.[1];
  if (status === 'wontfix') throw new Error(`Ticket ${ticketId} está marcado wontfix.`);
  if (!['ready-for-agent', 'ready-for-human', 'done'].includes(status)) {
    throw new Error(`Ticket ${ticketId} não está ativo (status: ${status ?? 'ausente'}).`);
  }

  const relativeSpec = join('cypress', 'e2e', 'tickets', feature, `${issue}.cy.ts`);
  const specFile = join(repositoryRoot, 'frontend', relativeSpec);
  if (!existsSync(specFile)) throw new Error(`Spec Cypress não existe para ${ticketId}: ${specFile}.`);

  const runDirectory = join(repositoryRoot, 'logs', 'e2e', feature, issue, timestampForPath(startedAt));
  const videoDirectory = join(runDirectory, 'videos');
  const logFile = join(runDirectory, 'run.txt');
  const videoConfig = `video=true,videosFolder=${videoDirectory},trashAssetsBeforeRuns=false`;
  const specRelativePath = relative(join(repositoryRoot, 'frontend'), specFile).split(sep).join('/');
  const cypressArgs = ['run', '--headed', '--browser', 'electron', '--spec', specRelativePath, '--config', videoConfig];

  return {
    ticketId,
    ticketFile,
    specFile,
    specRelativePath,
    runDirectory,
    videoDirectory,
    logFile,
    cypressExecutable: join(repositoryRoot, 'frontend', 'node_modules', 'cypress', 'bin', 'cypress'),
    cypressArgs,
  };
}
