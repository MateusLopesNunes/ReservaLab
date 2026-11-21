import { z } from 'zod'

export const createEquipmentSchema = z.strictObject({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000).optional()
})

export type CreateEquipment = z.infer<typeof createEquipmentSchema>
