import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createPlatformIdentityService } from '../../src/identity/index.ts';
import { MemoryPlatformIdentityStore } from '../support/memory-platform-identity-store.ts';

const username = 'platform-root';

test('operador provisiona a conta global e recebe um código de ativação de uso único', async () => {
  const store = new MemoryPlatformIdentityStore();
  let id = 0;
  const identity = createPlatformIdentityService({
    store,
    now: () => new Date('2026-09-29T12:00:00.000Z'),
    newId: () => `system-admin-${++id}`,
    newActivationCode: () => 'one-time-activation-secret',
    newCeremonyToken: () => 'ceremony-session-secret',
    newToken: () => 'p'.repeat(43),
    newLoginToken: () => 'login-ceremony-secret',
    webAuthn: {
      registrationOptions: async () => ({ challenge: 'unused' } as never),
      verifyRegistration: async () => ({ verified: false, userVerified: false,
        credential: { id: '', publicKey: new Uint8Array(), counter: 0 } }),
      authenticationOptions: async () => ({ challenge: 'unused', userVerification: 'required' } as never),
      verifyAuthentication: async () => ({ verified: false, userVerified: false, newCounter: 0 }),
    },
  });

  const result = await identity.provisionInitial({ username });

  assert.deepEqual(result, { username, activationCode: 'one-time-activation-secret' });
});

test('titular com código válido inicia o cadastro da primeira passkey', async () => {
  const store = new MemoryPlatformIdentityStore();
  let id = 0;
  const identity = createPlatformIdentityService({
    store,
    now: () => new Date('2026-09-29T12:00:00.000Z'),
    newId: () => `system-admin-${++id}`,
    newActivationCode: () => 'one-time-activation-secret',
    newCeremonyToken: () => 'ceremony-session-secret',
    newToken: () => 'p'.repeat(43),
    newLoginToken: () => 'login-ceremony-secret',
    webAuthn: {
      registrationOptions: async () => ({ challenge: 'registration-challenge', user: { name: username } } as never),
      verifyRegistration: async (_response, challenge) => ({ verified: true, userVerified: true,
        credential: { id: 'passkey-1', publicKey: new Uint8Array([1]), counter: 0 } }),
      authenticationOptions: async () => ({ challenge: 'unused', userVerification: 'required' } as never),
      verifyAuthentication: async () => ({ verified: true, userVerified: true, newCounter: 1 }),
    },
  });
  await identity.provisionInitial({ username });

  const activated = await identity.beginActivation({ username, activationCode: 'one-time-activation-secret' });

  assert.deepEqual(activated, {
    options: { challenge: 'registration-challenge', user: { name: username } },
    ceremonyToken: 'ceremony-session-secret',
  });
});

test('cadastro de passkey verificada ativa a conta e libera uma sessão global', async () => {
  const store = new MemoryPlatformIdentityStore();
  let id = 0;
  const identity = createPlatformIdentityService({
    store,
    now: () => new Date('2026-09-29T12:00:00.000Z'),
    newId: () => `system-admin-${++id}`,
    newActivationCode: () => 'one-time-activation-secret',
    newCeremonyToken: () => 'ceremony-session-secret',
    newToken: () => 'platform-session-secret',
    newLoginToken: () => 'login-ceremony-secret',
    webAuthn: {
      registrationOptions: async () => ({ challenge: 'registration-challenge' } as never),
      verifyRegistration: async (_response: unknown, challenge: string) => ({
        verified: challenge === 'registration-challenge',
        userVerified: true,
        credential: { id: 'passkey-1', publicKey: new Uint8Array([1]), counter: 0 },
      }),
      authenticationOptions: async () => ({ challenge: 'unused', userVerification: 'required' } as never),
      verifyAuthentication: async () => ({ verified: true, userVerified: true, newCounter: 1 }),
    },
  });
  await identity.provisionInitial({ username });
  const started = await identity.beginActivation({ username, activationCode: 'one-time-activation-secret' });

  const activated = await identity.completeActivation({ username, ceremonyToken: started.ceremonyToken, response: { id: 'passkey-1' } });

  assert.deepEqual(activated, {
    token: 'platform-session-secret',
    expiresAt: '2026-09-29T20:00:00.000Z',
    principal: { accountId: 'system-admin-1', username, role: 'SUPER_ADMIN', permissions: ['platform:institution:create'] },
  });
});

test('titular entra com nome de usuário global e passkey com verificação local', async () => {
  const store = new MemoryPlatformIdentityStore();
  let id = 0;
  const identity = createPlatformIdentityService({
    store,
    now: () => new Date('2026-09-29T12:00:00.000Z'),
    newId: () => `system-admin-${++id}`,
    newActivationCode: () => 'one-time-activation-secret',
    newCeremonyToken: () => 'activation-ceremony-secret',
    newToken: () => 'p'.repeat(43),
    webAuthn: {
      registrationOptions: async () => ({ challenge: 'registration-challenge' } as never),
      verifyRegistration: async () => ({ verified: true, userVerified: true,
        credential: { id: 'passkey-1', publicKey: new Uint8Array([1]), counter: 0 } }),
      authenticationOptions: async () => ({ challenge: 'login-challenge', userVerification: 'required' } as never),
      verifyAuthentication: async () => ({ verified: true, userVerified: true, newCounter: 1 }),
    } as never,
    newLoginToken: () => 'login-ceremony-secret',
  } as never);
  await identity.provisionInitial({ username });
  const activation = await identity.beginActivation({ username, activationCode: 'one-time-activation-secret' });
  await identity.completeActivation({ username, ceremonyToken: activation.ceremonyToken, response: { id: 'passkey-1' } });

  const started = await (identity as unknown as { beginLogin(input: unknown): Promise<any> }).beginLogin({ username });
  assert.equal(started.options.userVerification, 'required');
  const login = await (identity as unknown as { completeLogin(input: unknown): Promise<any> }).completeLogin({
    username, ceremonyToken: 'login-ceremony-secret', response: { id: 'passkey-1' },
  });
  assert.equal(login.principal.role, 'SUPER_ADMIN');
  assert.equal((await identity.authenticate(login.token)).username, username);
});

test('operador local reativa conta perdida, revoga sessões e substitui passkeys', async () => {
  const store = new MemoryPlatformIdentityStore();
  let id = 0;
  const identity = createPlatformIdentityService({ store, now: () => new Date('2026-09-29T12:00:00.000Z'),
    newId: () => `id-${++id}`, newActivationCode: () => 'initial-code', newRecoveryCode: () => 'replacement-code',
    newCeremonyToken: () => 'activation-ceremony-secret', newLoginToken: () => 'login-ceremony-secret',
    newToken: () => 'p'.repeat(43), webAuthn: {
      registrationOptions: async () => ({ challenge: 'registration-challenge' } as never),
      verifyRegistration: async () => ({ verified: true, userVerified: true, credential: { id: 'new-key', publicKey: new Uint8Array([2]), counter: 0 } }),
      authenticationOptions: async () => ({ challenge: 'login-challenge', userVerification: 'required' } as never),
      verifyAuthentication: async () => ({ verified: true, userVerified: true, newCounter: 1 }),
    } });
  await identity.provisionInitial({ username });
  let activation = await identity.beginActivation({ username, activationCode: 'initial-code' });
  const first = await identity.completeActivation({ username, ceremonyToken: activation.ceremonyToken, response: { id: 'first-key' } });
  await identity.recover({ username });
  await assert.rejects(identity.authenticate(first.token));
  activation = await identity.beginActivation({ username, activationCode: 'replacement-code' });
  const second = await identity.completeActivation({ username, ceremonyToken: activation.ceremonyToken, response: { id: 'second-key' } });
  assert.equal(second.principal.role, 'SUPER_ADMIN');
  await assert.rejects(identity.beginActivation({ username, activationCode: 'replacement-code' }));
});
