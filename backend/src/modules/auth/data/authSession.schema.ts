import { index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { userAccount } from './userAccount.schema.js'

export const authSession = pgTable('auth_session', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => userAccount.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true })
}, table => [index('auth_session_user_index').on(table.userId)])
