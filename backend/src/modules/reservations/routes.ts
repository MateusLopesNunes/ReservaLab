import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { equipmentIdSchema, reservationInputSchema } from './schemas/reservationInput.js'
import { ReservationError } from './services/reservationError.js'
import { createEquipmentReservation, getEquipmentAgenda } from './services/reservationService.js'

type ReservationParams = { equipmentId: string }

export const reservationsRouter = Router({ mergeParams: true })

const authSchema = z.object({ userId: z.uuid() })
const authRequired = { code: 'AUTH_REQUIRED', message: 'Entre para acessar as reservas.' }
const invalidEquipment = { code: 'EQUIPMENT_INVALID', message: 'Informe um identificador de equipamento válido.' }
const internalError = { code: 'RESERVATION_ERROR', message: 'Não foi possível acessar as reservas. Tente novamente.' }

function readReservationContext(request: Request<ReservationParams>, response: Response) {
  const auth = authSchema.safeParse(response.locals.auth as unknown)
  if (!auth.success) {
    response.status(401).json(authRequired)
    return
  }
  const equipmentId = equipmentIdSchema.safeParse(request.params.equipmentId)
  if (!equipmentId.success) {
    response.status(400).json(invalidEquipment)
    return
  }
  return { equipmentId: equipmentId.data, userId: auth.data.userId }
}

function respondToError(response: Response, error: unknown): void {
  if (error instanceof ReservationError) {
    response.status(error.status).json({ code: error.code, message: error.message })
    return
  }
  response.status(500).json(internalError)
}

reservationsRouter.get<ReservationParams>('/', async (request, response): Promise<void> => {
  const context = readReservationContext(request, response)
  if (!context) return
  try {
    response.json(await getEquipmentAgenda(context))
  } catch (error) {
    respondToError(response, error)
  }
})

reservationsRouter.post<ReservationParams>('/', async (request, response): Promise<void> => {
  const context = readReservationContext(request, response)
  if (!context) return

  const input = reservationInputSchema.safeParse(request.body)
  if (!input.success) {
    const fields = input.error.issues.flatMap(({ path }) => {
      const field = path[0]
      return field === 'startsAt' || field === 'endsAt' ? [field] : []
    })
    response.status(400).json({
      code: 'RESERVATION_INVALID',
      message: 'Informe início e fim válidos com fuso.',
      ...(fields.length > 0 && { fields })
    })
    return
  }

  try {
    response.status(201).json(await createEquipmentReservation({ ...input.data, ...context }))
  } catch (error) {
    respondToError(response, error)
  }
})
