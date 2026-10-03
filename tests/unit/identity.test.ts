import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createIdentityService, hashPassword } from '../../src/identity/index.ts';
import type { Account } from '../../src/identity/index.ts';
import { MemoryIdentityStore } from '../support/memory-identity-store.ts';

const credentials = { institution: 'escola-ficticia', username: 'secretaria', password: 'senha-ficticia-longa' };

async function setup(overrides: Partial<Account> = {}) {
  let instant = new Date('2026-09-29T12:00:00Z');
  let tokenNumber = 0;
  const store = new MemoryIdentityStore([{
    id: '00000000-0000-4000-8000-000000000001', tenantId: '00000000-0000-4000-8000-000000000010',
    institution: 'escola-ficticia', institutionName: 'Escola Fictícia', username: 'secretaria',
    passwordHash: await hashPassword(credentials.password), role: 'ACADEMIC_SECRETARY',
    active: true, accountContext: 'professional',
    ...overrides,
  }]);
  const identity = createIdentityService({ store, now: () => instant,
    newToken: () => String(++tokenNumber).padStart(64, 'a') });
  return { identity, store, advance: (ms: number) => { instant = new Date(instant.getTime() + ms); } };
}

test('login profissional vincula a sessão à instituição da conta', async () => {
  const { identity } = await setup();
  const login = await identity.login(credentials);
  const session = await identity.authenticate(login.token);
  assert.equal(session.tenantId, '00000000-0000-4000-8000-000000000010');
  assert.equal(session.institutionName, 'Escola Fictícia');
  assert.deepEqual(session.permissions, ['people:create', 'people:read']);
  assert.equal('passwordHash' in session, false);
});

test('sessão expirada ou conta desativada perde acesso', async () => {
  const { identity, store, advance } = await setup();
  const first = await identity.login(credentials);
  advance(8 * 60 * 60 * 1000);
  await assert.rejects(identity.authenticate(first.token), { code: 'UNAUTHENTICATED' });
  const second = await identity.login(credentials);
  store.disableAccount(second.principal.accountId);
  await assert.rejects(identity.authenticate(second.token), { code: 'UNAUTHENTICATED' });
  await assert.rejects(identity.login(credentials), { code: 'UNAUTHENTICATED' });
});

test('sair revoga a sessão e não afeta outra sessão da conta', async () => {
  const { identity } = await setup();
  const first = await identity.login(credentials);
  const second = await identity.login(credentials);
  await identity.logout(first.token);
  await assert.rejects(identity.authenticate(first.token), { code: 'UNAUTHENTICATED' });
  assert.equal((await identity.authenticate(second.token)).username, 'secretaria');
});

test('tentativas repetidas são limitadas e liberadas após um minuto', async () => {
  const { identity, advance } = await setup();
  for (let i = 0; i < 5; i++) await assert.rejects(identity.login({ ...credentials, password: 'senha incorreta' }), { code: 'UNAUTHENTICATED' });
  await assert.rejects(identity.login(credentials), { code: 'RATE_LIMITED' });
  advance(60_000);
  assert.equal((await identity.login(credentials)).principal.username, 'secretaria');
});

test('instituição incorreta e senha incorreta não revelam a existência da conta', async () => {
  const { identity } = await setup();
  const expected = { code: 'UNAUTHENTICATED', message: 'Acesso inválido ou sessão expirada.' };
  await assert.rejects(identity.login({ ...credentials, institution: 'outra-escola' }), expected);
  await assert.rejects(identity.login({ ...credentials, password: 'senha incorreta' }), expected);
  await assert.rejects(identity.authenticate('token-inventado'), expected);
});

test('contas de aluno e responsável não acessam o portal profissional', async () => {
  for (const accountContext of ['student', 'guardian'] as const) {
    const { identity } = await setup({ accountContext });
    await assert.rejects(identity.login(credentials), { code: 'UNAUTHENTICATED' });
  }
});

test('papel global sem fluxo MFA não recebe sessão nesta entrega institucional', async () => {
  const { identity } = await setup({ role: 'SUPER_ADMIN' as Account['role'] });
  await assert.rejects(identity.login(credentials), { code: 'UNAUTHENTICATED' });
});

test('senha armazenada usa sal independente e rejeita valores curtos', async () => {
  const first = await hashPassword(credentials.password);
  const second = await hashPassword(credentials.password);
  assert.notEqual(first, second);
  assert.equal(first.includes(credentials.password), false);
  await assert.rejects(hashPassword('curta'));
});
