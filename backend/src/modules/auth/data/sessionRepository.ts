import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '../../../db/client.js'
import type { AuthIdentity } from '../services/accessToken.js'
import { authSession } from './authSession.schema.js'
import { refreshToken } from './refreshToken.schema.js'
import { findToken, revokeSession } from './sessionQueries.js'

type NewSession = { userId: string; expiresAt: Date; digest: string; previousDigest: string | undefined }

export async function startSession(input: NewSession) {
  return db.transaction(async transaction => {
    const { userId, expiresAt, digest, previousDigest } = input
    const previous = previousDigest && await findToken(transaction, previousDigest)
    if (previous) await revokeSession(transaction, previous.sessionId, new Date())
    const [session] = await transaction.insert(authSession).values({ userId, expiresAt }).returning()
    if (!session) throw new Error('Falha ao criar sessão.')
    await transaction.insert(refreshToken).values({ digest, sessionId: session.id })
    return session
  })
}

export async function sessionIsActive(identity: AuthIdentity): Promise<boolean> {
  const [session] = await db.select({ id: authSession.id }).from(authSession).where(and(
    eq(authSession.id, identity.sessionId), eq(authSession.userId, identity.userId),
    isNull(authSession.revokedAt), gt(authSession.expiresAt, new Date())
  ))
  return Boolean(session)
}

type LogoutInput = { bearer: AuthIdentity | null; digest: string | undefined; expectedSessionId: string | undefined }

export async function endSession(input: LogoutInput): Promise<boolean> {
  return db.transaction(async transaction => {
    const token = input.digest ? await findToken(transaction, input.digest) : undefined
    const cookieMatchesExpectation = token && token.sessionId === input.expectedSessionId
    const target = input.bearer?.sessionId ?? (cookieMatchesExpectation ? token.sessionId : undefined)
    if (!target) return false
    if (input.bearer) {
      const [session] = await transaction.select({ id: authSession.id }).from(authSession).where(and(
        eq(authSession.id, target), eq(authSession.userId, input.bearer.userId)
      ))
      if (!session) return false
    }
    await revokeSession(transaction, target, new Date())
    return token?.sessionId === target
  })
}
