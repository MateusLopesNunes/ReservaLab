import { SignJWT } from 'jose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { identifyBearer, signAccessToken } from './accessToken.js'

const key = Buffer.alloc(32, 7)
const identity = {
  userId: '24fe4e39-af48-4cf6-b3db-83f4a8219af5',
  sessionId: '16325457-2ae9-4caa-82d6-c9e988660905'
}

beforeEach(() => {
  vi.stubEnv('AUTH_JWT_SECRET', key.toString('base64url'))
  vi.stubEnv('AUTH_ALLOWED_ORIGIN', 'https://example.test')
})
afterEach(() => vi.unstubAllEnvs())

describe('JWT de acesso', () => {
  it('identifica a conta e a sessão emitidas', async () => {
    const token = await signAccessToken(identity)
    await expect(identifyBearer(`Bearer ${token}`)).resolves.toEqual(identity)
  })

  it.each([
    { issuer: 'outro' }, { audience: 'outra-api' }, { expiration: '0s' },
    { type: 'refresh' }, { key: Buffer.alloc(32, 3) }, { sessionId: 'inválido' }
  ])('recusa credencial assinada fora do contrato %#', async options => {
    const token = await new SignJWT({ sid: options.sessionId ?? identity.sessionId })
      .setProtectedHeader({ alg: 'HS256', typ: options.type ?? 'at+jwt' })
      .setSubject(identity.userId)
      .setIssuer(options.issuer ?? 'reservalab')
      .setAudience(options.audience ?? 'reservalab-api')
      .setExpirationTime(options.expiration ?? '15m')
      .sign(options.key ?? key)
    await expect(identifyBearer(`Bearer ${token}`)).resolves.toBeNull()
  })

  it('recusa credencial ausente ou malformada', async () => {
    await expect(identifyBearer(undefined)).resolves.toBeNull()
    await expect(identifyBearer('Basic abc')).resolves.toBeNull()
    await expect(identifyBearer('Bearer abc')).resolves.toBeNull()
  })
})
