import { sql } from 'drizzle-orm'
import { check, foreignKey, index, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core'
import { userAccount } from '../../auth/data/userAccount.schema.js'
import { equipment } from '../../equipment/data/equipment.schema.js'

export const EQUIPMENT_FOREIGN_KEY = 'reservation_equipment_id_fk'
export const PERIOD_EXCLUSION = 'reservation_equipment_period_excl'

export const reservation = pgTable('reservation', {
  id: uuid('id').primaryKey().defaultRandom(),
  equipmentId: uuid('equipment_id').notNull(),
  userId: uuid('user_id').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true, precision: 3 }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true, precision: 3 }).notNull()
}, (table) => [
  foreignKey({ name: EQUIPMENT_FOREIGN_KEY, columns: [table.equipmentId], foreignColumns: [equipment.id] }),
  foreignKey({ name: 'reservation_user_id_fk', columns: [table.userId], foreignColumns: [userAccount.id] }),
  check('reservation_ordered_period_ck', sql`${table.endsAt} > ${table.startsAt}`),
  index('reservation_equipment_starts_idx').on(table.equipmentId, table.startsAt, table.id)
])
