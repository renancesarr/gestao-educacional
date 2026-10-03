import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
  type WebAuthnCredential,
} from '@simplewebauthn/server';
import type { PlatformAdminAccount, PlatformPasskey, PlatformWebAuthn } from './platform.ts';

export function createPlatformWebAuthn(options: { origin: string; rpName: string }): PlatformWebAuthn {
  const origin = new URL(options.origin).origin;
  const rpID = new URL(origin).hostname;
  return {
    registrationOptions(account: PlatformAdminAccount) {
      return generateRegistrationOptions({
        rpName: options.rpName,
        rpID,
        userID: Buffer.from(account.id),
        userName: account.username,
        userDisplayName: account.username,
        timeout: 60_000,
        attestationType: 'none',
        authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
      });
    },
    async verifyRegistration(response: unknown, expectedChallenge: string) {
      const result = await verifyRegistrationResponse({
        response: response as RegistrationResponseJSON,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        requireUserVerification: true,
      });
      if (!result.verified || !result.registrationInfo) {
        return { verified: false, userVerified: false,
          credential: { id: '', publicKey: new Uint8Array(), counter: 0 } };
      }
      const { credential } = result.registrationInfo;
      const transports = (response as RegistrationResponseJSON).response.transports;
      return { verified: true, userVerified: result.registrationInfo.userVerified,
        credential: { id: credential.id, publicKey: credential.publicKey, counter: credential.counter,
          ...(transports ? { transports } : {}) } };
    },
    authenticationOptions() {
      return generateAuthenticationOptions({ rpID, timeout: 60_000, userVerification: 'required' });
    },
    async verifyAuthentication(response: unknown, passkey: PlatformPasskey, expectedChallenge: string) {
      const credential: WebAuthnCredential = {
        id: passkey.id,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: passkey.counter,
        ...(passkey.transports ? { transports: [...passkey.transports] } : {}),
      };
      const result = await verifyAuthenticationResponse({
        response: response as AuthenticationResponseJSON,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential,
        requireUserVerification: true,
      });
      return { verified: result.verified, userVerified: result.authenticationInfo.userVerified,
        newCounter: result.authenticationInfo.newCounter };
    },
  };
}
