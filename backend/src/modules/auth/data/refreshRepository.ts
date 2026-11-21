import { eq } from 'drizzle-orm'
import { db } from '../../../db/client.js'
import { authSession } from './authSession.schema.js'
import { refreshToken } from './refreshToken.schema.js'
import { findToken, revokeSession } from './sessionQueries.js'

type RotationInput = { digest: string; replacementDigest: string; expectedSessionId: string | undefined }

export async function rotateRefresh(input: RotationInput) {
  return db.transaction(async transaction => {
    const token = await findToken(transaction, input.digest)
    if (!token || (input.expectedSessionId && token.sessionId !== input.expectedSessionId)) return null

    const [session] = await transaction.select().from(authSession)
      .where(eq(authSession.id, token.sessionId)).for('update')
    const now = new Date()
    if (!session || session.revokedAt || session.expiresAt <= now) return null

    const current = await findToken(transaction, input.digest)
    if (!current) return null
    if (current.consumedAt) {
      await revokeSession(transaction, session.id, now)
      return null
    }

    await transaction.update(refreshToken).set({ consumedAt: now }).where(eq(refreshToken.digest, input.digest))
    await transaction.insert(refreshToken).values({ digest: input.replacementDigest, sessionId: session.id })
    return session
  }, { isolationLevel: 'read committed' })
}
