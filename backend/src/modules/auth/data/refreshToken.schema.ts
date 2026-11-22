import { index, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { authSession } from './authSession.schema.js'

export const refreshToken = pgTable('refresh_token', {
  digest: varchar('digest', { length: 64 }).primaryKey(),
  sessionId: uuid('session_id').notNull().references(() => authSession.id, { onDelete: 'cascade' }),
  consumedAt: timestamp('consumed_at', { withTimezone: true })
}, table => [index('refresh_token_session_index').on(table.sessionId)])
