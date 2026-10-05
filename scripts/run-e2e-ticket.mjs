import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { commandForHiddenDisplay, hasExecutedTests, planTicketE2ERun } from './e2e-ticket-runner.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ticketId = process.argv[2];

if (!ticketId) {
  process.stderr.write('Uso: npm run test:e2e:ticket -- <feature/NN-ticket-slug>\n');
  process.exit(2);
}

let plan;
try {
  plan = planTicketE2ERun(repositoryRoot, ticketId);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(2);
}

let runDirectory = plan.runDirectory;
mkdirSync(dirname(runDirectory), { recursive: true });
for (let suffix = 1; existsSync(runDirectory); suffix += 1) {
  runDirectory = `${plan.runDirectory}-${suffix}`;
}
mkdirSync(runDirectory, { recursive: false });
const videoDirectory = join(runDirectory, 'videos');
mkdirSync(videoDirectory);
const logFile = join(runDirectory, 'run.txt');
const cypressArgs = [...plan.cypressArgs];
cypressArgs[cypressArgs.indexOf('--config') + 1] = cypressArgs[cypressArgs.indexOf('--config') + 1]
  .replace(plan.videoDirectory, videoDirectory);
const launch = commandForHiddenDisplay(process.execPath, [plan.cypressExecutable, ...cypressArgs]);

const logLines = [
  `Ticket: ${ticketId}`,
  `Início: ${new Date().toISOString()}`,
  `Spec: ${plan.specRelativePath}`,
  `Vídeos: ${videoDirectory}`,
  `Comando: ${launch.command} ${launch.args.join(' ')}`,
  '',
];
const result = spawnSync(launch.command, launch.args, {
  cwd: join(repositoryRoot, 'frontend'),
  env: { ...process.env, GESTAO_E2E_TICKET: ticketId },
  encoding: 'utf8',
  maxBuffer: 100 * 1024 * 1024,
});

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
logLines.push(result.stdout ?? '', result.stderr ?? '');

function findVideos(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findVideos(path);
    return entry.name.endsWith('.mp4') ? [path] : [];
  });
}

const videos = findVideos(videoDirectory);
let exitCode = result.status ?? 1;
if (result.error) logLines.push(`Erro ao iniciar Cypress: ${result.error.message}`);
if (exitCode === 0 && !hasExecutedTests(`${result.stdout ?? ''}\n${result.stderr ?? ''}`)) {
  exitCode = 1;
  logLines.push('ERRO: Cypress concluiu sem executar testes.');
}
if (exitCode === 0 && videos.length === 0) {
  exitCode = 1;
  logLines.push('ERRO: o teste passou, mas Cypress não gerou o vídeo de evidência obrigatório.');
}
logLines.push(`Vídeo(s): ${videos.length ? videos.join(', ') : 'não gerado'}`);
logLines.push(`Fim: ${new Date().toISOString()}`);
writeFileSync(logFile, logLines.join('\n'), 'utf8');

process.stdout.write(`\nLog: ${logFile}\n`);
process.stdout.write(`Vídeo: ${videos.length ? videos.join('\n') : 'não gerado'}\n`);
process.exitCode = exitCode;
