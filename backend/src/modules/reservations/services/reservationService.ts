import { equipmentExists, insertReservation, listReservations, type Reservation } from '../data/reservationRepository.js'
import type { ReservationInput } from '../schemas/reservationInput.js'
import { isReservationDeadlock, ReservationError, mapReservationDatabaseError } from './reservationError.js'

type ReservationQuery = { equipmentId: string; userId: string }
type CreateReservation = ReservationQuery & ReservationInput

type ReservationDto = {
  id: string
  equipmentId: string
  startsAt: string
  endsAt: string
  isMine: boolean
}

function toReservationDto(item: Reservation, userId: string): ReservationDto {
  return {
    id: item.id,
    equipmentId: item.equipmentId,
    startsAt: item.startsAt.toISOString(),
    endsAt: item.endsAt.toISOString(),
    isMine: item.userId === userId
  }
}

async function requireEquipment(equipmentId: string): Promise<void> {
  if (!(await equipmentExists(equipmentId))) throw new ReservationError('EQUIPMENT_NOT_FOUND')
}

export async function getEquipmentAgenda(query: ReservationQuery, now = new Date()): Promise<ReservationDto[]> {
  await requireEquipment(query.equipmentId)
  const items = await listReservations(query.equipmentId, now)
  return items.map((item) => toReservationDto(item, query.userId))
}

async function insertWithDeadlockRetry(input: CreateReservation): Promise<Reservation> {
  try {
    return await insertReservation(input)
  } catch (error) {
    if (!isReservationDeadlock(error)) throw error
    return insertReservation(input)
  }
}

export async function createEquipmentReservation(input: CreateReservation, now = new Date()): Promise<ReservationDto> {
  if (input.startsAt <= now || input.endsAt <= input.startsAt) {
    throw new ReservationError('RESERVATION_PERIOD_INVALID')
  }

  await requireEquipment(input.equipmentId)
  try {
    const created = await insertWithDeadlockRetry(input)
    return toReservationDto(created, input.userId)
  } catch (error) {
    throw mapReservationDatabaseError(error)
  }
}
