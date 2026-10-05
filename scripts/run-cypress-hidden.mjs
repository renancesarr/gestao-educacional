import { spawnSync } from 'node:child_process';
import { commandForHiddenDisplay } from './e2e-ticket-runner.mjs';

const launch = commandForHiddenDisplay('cypress', process.argv.slice(2));
const result = spawnSync(launch.command, launch.args, { stdio: 'inherit' });

if (result.error) {
  process.stderr.write(`Não foi possível iniciar Cypress: ${result.error.message}\n`);
  process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
