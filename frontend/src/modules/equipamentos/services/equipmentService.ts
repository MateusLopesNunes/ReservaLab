import { z } from 'zod'
import { createEquipmentSchema, equipmentSchema, type CreateEquipment, type Equipment } from '../schemas/equipmentSchema'

const equipmentListSchema = z.array(equipmentSchema)

export async function listEquipment(): Promise<Equipment[]> {
  const response = await fetch('/api/equipment')
  if (!response.ok) throw new Error('Não foi possível carregar os equipamentos.')

  const data: unknown = await response.json()
  const result = equipmentListSchema.safeParse(data)
  if (!result.success) throw new Error('A lista de equipamentos recebida é inválida.', { cause: result.error })
  return result.data
}

export async function createEquipment(input: CreateEquipment): Promise<Equipment> {
  const payload = createEquipmentSchema.parse(input)
  const response = await fetch('/api/equipment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!response.ok) throw new Error('Não foi possível cadastrar o equipamento.')

  const data: unknown = await response.json()
  const result = equipmentSchema.safeParse(data)
  if (!result.success) throw new Error('O equipamento recebido é inválido.', { cause: result.error })
  return result.data
}
