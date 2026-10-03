// UI verification only: no production entry point imports this fixture.
import { createHttpServer } from '../src/http/server.ts';
import { fixtureServices } from '../tests/support/fixture.ts';
const services = await fixtureServices();
const server = createHttpServer(services, { origin: 'http://127.0.0.1:4317' });
server.listen(4317, '127.0.0.1', () => console.log('Prévia com dados fictícios em memória: http://127.0.0.1:4317'));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => server.close());
