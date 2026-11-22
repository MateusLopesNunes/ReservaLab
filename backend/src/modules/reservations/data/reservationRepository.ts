import { and, asc, eq, gt } from 'drizzle-orm'
import { db } from '../../../db/client.js'
import { equipment } from '../../equipment/data/equipment.schema.js'
import { reservation } from './reservation.schema.js'

export type Reservation = typeof reservation.$inferSelect
type NewReservation = Omit<Reservation, 'id'>

export async function equipmentExists(id: string): Promise<boolean> {
  const [item] = await db.select({ id: equipment.id }).from(equipment).where(eq(equipment.id, id)).limit(1)
  return item !== undefined
}

export async function listReservations(equipmentId: string, now: Date): Promise<Reservation[]> {
  return db.select().from(reservation)
    .where(and(eq(reservation.equipmentId, equipmentId), gt(reservation.endsAt, now)))
    .orderBy(asc(reservation.startsAt), asc(reservation.id))
}

export async function insertReservation(input: NewReservation): Promise<Reservation> {
  const [created] = await db.insert(reservation).values(input).returning()
  if (!created) throw new Error('O banco não retornou a reserva inserida.')
  return created
}
