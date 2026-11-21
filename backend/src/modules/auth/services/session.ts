import { rotateRefresh } from '../data/refreshRepository.js'
import { endSession, startSession } from '../data/sessionRepository.js'
import { accessLifetimeSeconds, identifyBearer, signAccessToken } from './accessToken.js'
import { AuthError } from './authError.js'
import { digestRefreshSecret, newRefreshSecret } from './refreshSecret.js'

const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000
type Session = { id: string; userId: string; expiresAt: Date }

async function issueCredentials(session: Session, secret: string) {
  const identity = { userId: session.userId, sessionId: session.id }
  const accessToken = await signAccessToken(identity)
  const body = { ...identity, accessToken, expiresIn: accessLifetimeSeconds }
  return { body, refresh: secret, expiresAt: session.expiresAt }
}

export async function logIn(userId: string, previousRefresh?: string) {
  const secret = newRefreshSecret()
  const session = await startSession({
    userId, expiresAt: new Date(Date.now() + sessionLifetimeMs), digest: digestRefreshSecret(secret),
    previousDigest: previousRefresh ? digestRefreshSecret(previousRefresh) : undefined
  })
  return issueCredentials(session, secret)
}

export async function renewSession(incoming: string | undefined, expectedSessionId?: string) {
  if (!incoming) throw new AuthError(401, 'INVALID_REFRESH', 'Sessão indisponível.')
  const secret = newRefreshSecret()
  const session = await rotateRefresh({
    digest: digestRefreshSecret(incoming), replacementDigest: digestRefreshSecret(secret), expectedSessionId
  })
  if (!session) throw new AuthError(401, 'INVALID_REFRESH', 'Sessão indisponível.')
  return issueCredentials(session, secret)
}

export async function logOut(header: string | undefined, refresh: string | undefined, expectedSessionId?: string) {
  const bearer = await identifyBearer(header)
  return endSession({ bearer, expectedSessionId, digest: refresh ? digestRefreshSecret(refresh) : undefined })
}
