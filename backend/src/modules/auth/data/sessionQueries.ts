import { eq, isNull, and } from 'drizzle-orm'
import type { db } from '../../../db/client.js'
import { authSession } from './authSession.schema.js'
import { refreshToken } from './refreshToken.schema.js'

export type SessionTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]

export async function findToken(transaction: SessionTransaction, digest: string) {
  const [token] = await transaction.select().from(refreshToken).where(eq(refreshToken.digest, digest))
  return token
}

export async function revokeSession(transaction: SessionTransaction, id: string, now: Date) {
  await transaction.update(authSession).set({ revokedAt: now })
    .where(and(eq(authSession.id, id), isNull(authSession.revokedAt)))
}
