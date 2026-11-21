import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import app from '../../app.js'

vi.mock('../equipment/data/equipmentRepository.js', () => ({
  createEquipment: vi.fn(),
  listEquipment: vi.fn()
}))

vi.mock('../auth/routes.js', async () => {
  const { Router } = await import('express')
  return { authRouter: Router(), requireAuthentication: vi.fn() }
})
vi.mock('../reservations/routes.js', async () => {
  const { Router } = await import('express')
  return { reservationsRouter: Router() }
})

describe('GET /api/status', () => {
  it('retorna o contrato de status da API em JSON', async () => {
    const response = await request(app).get('/api/status')

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/application\/json/)
    expect(response.body).toEqual({
      status: 'ok',
      message: 'API do ReservaLab funcionando!'
    })
  })

  it('retorna 404 para uma rota desconhecida', async () => {
    const response = await request(app).get('/api/inexistente')

    expect(response.status).toBe(404)
  })
})
