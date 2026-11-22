import { date, foreignKey, pgTable, text, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import { city } from '../../profileOptions/data/city.schema.js'
import { sexOption } from '../../profileOptions/data/sexOption.schema.js'
import { state } from '../../profileOptions/data/state.schema.js'

export const userAccount = pgTable('user_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 254 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  state: varchar('state', { length: 2 }).notNull(),
  city: uuid('city').notNull(),
  birthDate: date('birth_date').notNull(),
  sex: varchar('sex', { length: 32 }).notNull()
}, table => [
  unique('user_account_email_unique').on(table.email),
  foreignKey({ name: 'user_account_state_fk', columns: [table.state], foreignColumns: [state.code] }),
  foreignKey({ name: 'user_account_city_state_fk', columns: [table.state, table.city], foreignColumns: [city.stateCode, city.id] }),
  foreignKey({ name: 'user_account_sex_fk', columns: [table.sex], foreignColumns: [sexOption.code] })
])
