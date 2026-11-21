import { date, pgTable, text, unique, uuid, varchar } from 'drizzle-orm/pg-core'

export const userAccount = pgTable('user_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 254 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  city: varchar('city', { length: 120 }).notNull(),
  birthDate: date('birth_date').notNull(),
  sex: varchar('sex', { length: 60 }).notNull()
}, table => [unique('user_account_email_unique').on(table.email)])
