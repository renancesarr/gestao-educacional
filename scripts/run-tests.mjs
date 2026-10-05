import { spawnSync } from 'node:child_process';
import { mkdir, open } from 'node:fs/promises';
import { writeSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const logsDirectory = resolve(repositoryRoot, 'logs');
await mkdir(logsDirectory, { recursive: true });

const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
let logPath = resolve(logsDirectory, `log-teste-${timestamp}.txt`);
let logHandle;
for (let suffix = 1; ; suffix += 1) {
  try {
    logHandle = await open(logPath, 'wx');
    break;
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    logPath = resolve(logsDirectory, `log-teste-${timestamp}-${suffix}.txt`);
  }
}

const commands = [
  ['Testes unitários backend', ['run', 'test:unit']],
  ['Testes HTTP backend', ['run', 'test:http']],
  ['Testes SQLite backend', ['run', 'test:sqlite']],
  ['Typecheck backend', ['run', 'typecheck']],
  ['Testes unitários frontend', ['--prefix', 'frontend', 'test']],
  ['Lint frontend', ['--prefix', 'frontend', 'run', 'lint']],
  ['Typecheck frontend', ['--prefix', 'frontend', 'run', 'typecheck']],
  ['Build frontend', ['--prefix', 'frontend', 'run', 'build']],
  ['E2E em tela virtual com gravação de vídeo', ['--prefix', 'frontend', 'run', 'test:e2e']],
];

function writeLine(line) {
  const text = `${line}\n`;
  process.stdout.write(text);
  writeSync(logHandle.fd, text);
}

function run(command, args) {
  writeLine(`\n=== ${command}: npm ${args.join(' ')} ===`);
  const result = spawnSync('npm', args, {
    cwd: repositoryRoot,
    env: process.env,
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
  });
  if (result.stdout) {
    process.stdout.write(result.stdout);
    writeSync(logHandle.fd, result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
    writeSync(logHandle.fd, result.stderr);
  }
  if (result.error) {
    writeLine(`Erro ao iniciar npm: ${result.error.message}`);
    return 1;
  }
  return result.status ?? 1;
}

writeLine(`Início: ${new Date().toISOString()}`);
writeLine(`Log: ${logPath}`);

let exitCode = 0;
try {
  for (const [label, args] of commands) {
    exitCode = run(label, args);
    if (exitCode !== 0) {
      writeLine(`\nFALHOU: ${label} (código ${exitCode}).`);
      break;
    }
  }
  if (exitCode === 0) writeLine('\nSUCESSO: todas as suítes passaram.');
} catch (error) {
  exitCode = 1;
  writeLine(`\nERRO ao iniciar comando: ${error.message}`);
} finally {
  writeLine(`Fim: ${new Date().toISOString()}`);
  await logHandle.sync();
  await logHandle.close();
}

process.exitCode = exitCode;
