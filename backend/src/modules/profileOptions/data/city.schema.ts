import { foreignKey, pgTable, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import { state } from './state.schema.js'

export const city = pgTable('city', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 120 }).notNull(),
  stateCode: varchar('state_code', { length: 2 }).notNull()
}, table => [
  foreignKey({ name: 'city_state_fk', columns: [table.stateCode], foreignColumns: [state.code] }),
  unique('city_state_id_unique').on(table.stateCode, table.id),
  unique('city_state_name_unique').on(table.stateCode, table.name)
])
