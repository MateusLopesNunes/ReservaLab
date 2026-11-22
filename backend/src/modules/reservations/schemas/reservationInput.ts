import { z } from 'zod'

export const equipmentIdSchema = z.uuid('Informe um identificador de equipamento válido.')

const instantSchema = z.union([
  z.iso.datetime({ offset: true }),
  z.iso.datetime({ offset: true, precision: -1 })
], { error: 'Informe um horário válido com fuso.' })
  .refine((value) => !/\.\d{4}/.test(value), 'Informe horários com precisão de até milissegundos.')
  .refine((value) => !value.startsWith('0000-'), 'Informe um ano de calendário válido.')
  .transform((value) => new Date(value))
  .refine((value) => value.getUTCFullYear() >= 1 && value.getUTCFullYear() <= 9999,
    'Informe um horário dentro do calendário suportado.')

export const reservationInputSchema = z.strictObject({
  startsAt: instantSchema,
  endsAt: instantSchema
})

export type ReservationInput = z.output<typeof reservationInputSchema>
