import { z } from 'zod'

const email = z.string().trim().toLowerCase().max(254).pipe(z.email())
const password = z.string().min(15).max(128)
const requiredText = (limit: number) => z.string().trim().min(1).max(limit)

export const credentialsSchema = z.strictObject({ email, password })
export const registrationSchema = credentialsSchema.extend({
  firstName: requiredText(100),
  lastName: requiredText(100),
  state: requiredText(100),
  city: requiredText(120),
  birthDate: z.iso.date().refine(value => !value.startsWith('0000-') && value <= new Date().toISOString().slice(0, 10)),
  sex: requiredText(60)
})
export const sessionInputSchema = z.strictObject({ sessionId: z.uuid().optional() })

export type Credentials = z.infer<typeof credentialsSchema>
export type Registration = z.infer<typeof registrationSchema>
