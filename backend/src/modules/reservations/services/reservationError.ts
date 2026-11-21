import { DrizzleQueryError } from 'drizzle-orm/errors'
import { EQUIPMENT_FOREIGN_KEY, PERIOD_EXCLUSION } from '../data/reservation.schema.js'

const errors = {
  RESERVATION_PERIOD_INVALID: { status: 400, message: 'O início deve estar no futuro e o fim deve ser posterior ao início.' },
  EQUIPMENT_NOT_FOUND: { status: 404, message: 'Equipamento não encontrado.' },
  RESERVATION_CONFLICT: { status: 409, message: 'O equipamento já está reservado nesse horário.' }
} as const

type ReservationErrorCode = keyof typeof errors

export class ReservationError extends Error {
  readonly status: (typeof errors)[ReservationErrorCode]['status']

  constructor(readonly code: ReservationErrorCode) {
    super(errors[code].message)
    this.status = errors[code].status
  }
}

const EXCLUSION_VIOLATION = '23P01'
const FOREIGN_KEY_VIOLATION = '23503'
const DEADLOCK_DETECTED = '40P01'

function getDatabaseError(error: unknown): unknown {
  return error instanceof DrizzleQueryError ? error.cause : error
}

export function isReservationDeadlock(error: unknown): boolean {
  const databaseError = getDatabaseError(error)
  return databaseError !== null && typeof databaseError === 'object' && 'code' in databaseError
    && databaseError.code === DEADLOCK_DETECTED
}

export function mapReservationDatabaseError(error: unknown): unknown {
  const databaseError = getDatabaseError(error)
  if (!databaseError || typeof databaseError !== 'object') return error
  if (!('code' in databaseError) || !('constraint' in databaseError)) return error
  if (databaseError.code === EXCLUSION_VIOLATION && databaseError.constraint === PERIOD_EXCLUSION) {
    return new ReservationError('RESERVATION_CONFLICT')
  }
  if (databaseError.code === FOREIGN_KEY_VIOLATION && databaseError.constraint === EQUIPMENT_FOREIGN_KEY) {
    return new ReservationError('EQUIPMENT_NOT_FOUND')
  }
  return error
}
