import { asc } from 'drizzle-orm'
import { db } from '../../../db/client.js'
import type { CreateEquipment } from '../schemas/createEquipment.js'
import { equipment } from './equipment.schema.js'

export type Equipment = typeof equipment.$inferSelect

export async function listEquipment(): Promise<Equipment[]> {
  return db.select().from(equipment).orderBy(asc(equipment.name), asc(equipment.id))
}

export async function createEquipment(input: CreateEquipment): Promise<Equipment> {
  const [created] = await db.insert(equipment).values(input).returning()
  if (!created) throw new Error('Falha ao cadastrar equipamento')
  return created
}
