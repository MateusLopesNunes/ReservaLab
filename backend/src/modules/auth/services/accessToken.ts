import { jwtVerify, SignJWT } from 'jose'
import { z } from 'zod'
import { validateAuthConfig } from '../authConfig.js'

export const accessLifetimeSeconds = 900
const algorithm = 'HS256'
const issuer = 'reservalab'
const audience = 'reservalab-api'
const tokenType = 'at+jwt'
const identitySchema = z.object({ sub: z.uuid(), sid: z.uuid() })
export type AuthIdentity = { userId: string; sessionId: string }

export async function signAccessToken(identity: AuthIdentity): Promise<string> {
  const { jwtSecret } = validateAuthConfig()
  return new SignJWT({ sid: identity.sessionId })
    .setProtectedHeader({ alg: algorithm, typ: tokenType })
    .setSubject(identity.userId)
    .setIssuer(issuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(`${accessLifetimeSeconds}s`)
    .sign(jwtSecret)
}

export async function identifyBearer(header: string | undefined): Promise<AuthIdentity | null> {
  const token = /^Bearer (\S+)$/i.exec(header ?? '')?.[1]
  if (!token) return null
  const { jwtSecret } = validateAuthConfig()
  try {
    const { payload } = await jwtVerify(token, jwtSecret, {
      algorithms: [algorithm], issuer, audience, typ: tokenType, requiredClaims: ['exp', 'sub', 'sid']
    })
    const result = identitySchema.safeParse(payload)
    if (!result.success) return null
    return { userId: result.data.sub, sessionId: result.data.sid }
  } catch {
    return null
  }
}
