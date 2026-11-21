import { authenticatedFetch } from '../../auth/services/authenticatedFetch'
import { agendaSchema, reservationInputSchema, reservationSchema, type Reservation, type ReservationInput } from '../schemas/reservationSchema'

function endpoint(equipmentId: string): string {
  return `/api/equipment/${encodeURIComponent(equipmentId)}/reservations`
}

const errorMessages: Readonly<Record<number, string>> = {
  400: 'Informe um início futuro e um fim posterior ao início.',
  404: 'Esse equipamento não está mais disponível. Atualize a lista.',
  409: 'O equipamento já está reservado nesse horário. Atualize a agenda ou escolha outro período.'
}

export class ReservationRequestError extends Error {
  constructor(status: number, fallback: string) {
    super(errorMessages[status] ?? fallback)
  }
}

export async function listReservations(equipmentId: string): Promise<Reservation[]> {
  const response = await authenticatedFetch(endpoint(equipmentId))
  if (!response.ok) throw new ReservationRequestError(response.status, 'Não foi possível carregar a agenda. Tente novamente.')
  return agendaSchema.parse(await response.json())
}

export async function createReservation(equipmentId: string, input: ReservationInput): Promise<Reservation> {
  const payload = reservationInputSchema.parse(input)
  const response = await authenticatedFetch(endpoint(equipmentId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!response.ok) throw new ReservationRequestError(response.status, 'Não foi possível criar a reserva. Tente novamente.')
  return reservationSchema.parse(await response.json())
}
