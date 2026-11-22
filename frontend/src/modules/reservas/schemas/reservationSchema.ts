import { z } from 'zod'

const utcInstant = z.iso.datetime({ precision: 3 })

export const reservationInputSchema = z.strictObject({
  startsAt: utcInstant,
  endsAt: utcInstant
}).refine(({ startsAt, endsAt }) => Date.parse(endsAt) > Date.parse(startsAt), {
  message: 'O fim deve ser posterior ao início.'
})

export const reservationSchema = z.strictObject({
  id: z.uuid(),
  equipmentId: z.uuid(),
  startsAt: utcInstant,
  endsAt: utcInstant,
  isMine: z.boolean()
})

export const agendaSchema = z.array(reservationSchema)
export type ReservationInput = z.infer<typeof reservationInputSchema>
export type Reservation = z.infer<typeof reservationSchema>
