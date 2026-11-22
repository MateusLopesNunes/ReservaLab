import { pgTable, varchar } from 'drizzle-orm/pg-core'

export const state = pgTable('state', {
  code: varchar('code', { length: 2 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull()
})
