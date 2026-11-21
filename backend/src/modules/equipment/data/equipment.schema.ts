import { pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core'

export const equipment = pgTable('equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description')
})
