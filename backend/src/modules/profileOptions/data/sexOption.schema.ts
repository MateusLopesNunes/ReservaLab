import { pgTable, unique, varchar } from 'drizzle-orm/pg-core'

export const sexOption = pgTable('sex_option', {
  code: varchar('code', { length: 32 }).primaryKey(),
  label: varchar('label', { length: 60 }).notNull()
}, table => [unique('sex_option_label_unique').on(table.label)])
