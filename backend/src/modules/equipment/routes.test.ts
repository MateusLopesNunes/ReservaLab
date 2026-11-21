import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import app from '../../app.js'
import { createEquipment, listEquipment } from './data/equipmentRepository.js'

vi.mock('./data/equipmentRepository.js', () => ({
  createEquipment: vi.fn(),
  listEquipment: vi.fn()
}))

vi.mock('../auth/routes.js', async () => {
  const { Router } = await import('express')
  return {
    authRouter: Router(),
    requireAuthentication: (_request: unknown, _response: unknown, next: () => void) => next()
  }
})
vi.mock('../reservations/routes.js', async () => {
  const { Router } = await import('express')
  return { reservationsRouter: Router() }
})

const item = { id: 'd5c48d1f-a1b9-4fd2-b65e-718943a1bc57', name: 'Projetor', description: null }

beforeEach(() => vi.resetAllMocks())

describe('equipamentos', () => {
  it('lista os equipamentos', async () => {
    vi.mocked(listEquipment).mockResolvedValue([item])
    const response = await request(app).get('/api/equipment')
    expect(response.status).toBe(200)
    expect(response.body).toEqual([item])
  })

  it('cadastra equipamento com nome normalizado', async () => {
    vi.mocked(createEquipment).mockResolvedValue(item)
    const response = await request(app).post('/api/equipment').send({ name: ' Projetor ' })
    expect(response.status).toBe(201)
    expect(response.body).toEqual(item)
    expect(createEquipment).toHaveBeenCalledWith({ name: 'Projetor' })
  })

  it.each([{}, { name: '   ' }, { name: 1 }, { name: 'a'.repeat(151) }, { name: 'Projetor', extra: true }])(
    'rejeita entrada inválida %j', async (body) => {
      const response = await request(app).post('/api/equipment').send(body)
      expect(response.status).toBe(400)
      expect(createEquipment).not.toHaveBeenCalled()
    }
  )

  it('retorna erro controlado quando a listagem falha', async () => {
    vi.mocked(listEquipment).mockRejectedValue(new Error('banco indisponível'))
    const response = await request(app).get('/api/equipment')
    expect(response.status).toBe(500)
    expect(response.body.message).toBe('Não foi possível listar equipamentos.')
  })

  it('retorna erro controlado quando o cadastro falha', async () => {
    vi.mocked(createEquipment).mockRejectedValue(new Error('banco indisponível'))
    const response = await request(app).post('/api/equipment').send({ name: 'Projetor' })
    expect(response.status).toBe(500)
    expect(response.body.message).toBe('Não foi possível cadastrar equipamento.')
  })
})
