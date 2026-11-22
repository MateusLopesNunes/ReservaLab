import { z } from 'zod'

const name = z.string().trim().min(1)
export const stateCodeSchema = z.string().regex(/^[A-Z]{2}$/)
export const statesSchema = z.array(z.object({ code: stateCodeSchema, name }))
export const citiesSchema = z.array(z.object({
  id: z.uuid(), name, stateCode: stateCodeSchema
}))
export const sexOptionsSchema = z.array(z.object({
  code: z.string().min(1).max(32), label: name
}))
