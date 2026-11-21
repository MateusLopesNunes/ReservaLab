import { z } from 'zod'

export const createEquipmentSchema = z.strictObject({
  name: z.string().trim().min(1, 'Informe o nome do equipamento.').max(150),
  description: z.string().trim().max(1000).optional()
})

export const equipmentSchema = createEquipmentSchema.extend({
  id: z.uuid(),
  description: z.string().nullable()
})

export type CreateEquipment = z.infer<typeof createEquipmentSchema>
export type Equipment = z.infer<typeof equipmentSchema>
