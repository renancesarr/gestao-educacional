import { spawn, type ChildProcess } from 'node:child_process';
import { resolve, join } from 'node:path';
import { defineConfig } from 'cypress';

const frontendDirectory = process.cwd();
const repositoryRoot = resolve(frontendDirectory, '..');
let backend: ChildProcess | undefined;
let next: ChildProcess | undefined;

async function waitFor(url: string, child: ChildProcess, label: string) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`${label} stopped before becoming ready (exit ${child.exitCode}).`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch { /* Service is still starting. */ }
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
  }
  throw new Error(`${label} did not become ready at ${url}.`);
}

function stop(child: ChildProcess | undefined) {
  if (child && child.exitCode === null) child.kill('SIGTERM');
}

export default defineConfig({
  video: true,
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    screenshotOnRunFailure: false,
    async setupNodeEvents(on) {
      backend = spawn(process.execPath, [resolve(frontendDirectory, 'cypress/support/e2e-backend.ts')], {
        cwd: repositoryRoot, stdio: 'inherit',
      });
      await waitFor('http://127.0.0.1:3001/health', backend, 'Test backend');
      next = spawn(process.execPath, [join(frontendDirectory, 'node_modules/next/dist/bin/next'), 'dev', '--port', '3000'], {
        cwd: frontendDirectory,
        stdio: 'inherit',
        env: { ...process.env, BACKEND_URL: 'http://127.0.0.1:3001', NEXT_TELEMETRY_DISABLED: '1' },
      });
      await waitFor('http://localhost:3000/health', next, 'Next.js');
      on('after:run', () => { stop(next); stop(backend); });
    },
  },
});
