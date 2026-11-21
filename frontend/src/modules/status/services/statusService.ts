import { statusResponseSchema, type StatusResponse } from '../schemas/statusResponseSchema'

export async function getStatus(): Promise<StatusResponse> {
  const response = await fetch('/api/status')
  if (!response.ok) throw new Error('Falha ao consultar a API')

  const data: unknown = await response.json()
  const result = statusResponseSchema.safeParse(data)
  if (!result.success) throw new Error('Resposta de status inválida', { cause: result.error })

  return result.data
}
