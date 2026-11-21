import { DrizzleQueryError } from 'drizzle-orm/errors'
import express from 'express'
import request from 'supertest'
import { beforeEach, expect, it, vi } from 'vitest'
import { equipmentExists, insertReservation, listReservations } from './data/reservationRepository.js'
import { reservationsRouter } from './routes.js'

vi.mock('./data/reservationRepository.js', () => ({
  equipmentExists: vi.fn(), insertReservation: vi.fn(), listReservations: vi.fn()
}))

const equipmentId = 'd5c48d1f-a1b9-4fd2-b65e-718943a1bc57'
const userId = '85efbb93-5fe6-47cc-93a0-4bb2491dfb81'
const anotherUser = '85efbb93-5fe6-47cc-93a0-4bb2491dfb80'
const route = '/api/equipment/:equipmentId/reservations'
const agenda = `/api/equipment/${equipmentId}/reservations`
const payload = { startsAt: '2027-02-01T14:00:00.000-03:00', endsAt: '2027-02-01T15:00-03:00' }
const item = { id: equipmentId, equipmentId, userId, startsAt: new Date(payload.startsAt), endsAt: new Date(payload.endsAt) }

const app = express()
app.use(express.json())
app.use(route, (req, res, next) => {
  if (req.get('X-Recognized-Test-Account')) res.locals.auth = { userId }
  next()
}, reservationsRouter)

const create = (body: object = payload) => request(app).post(agenda).set('X-Recognized-Test-Account', 'yes').send(body)

beforeEach(() => {
  vi.resetAllMocks()
  vi.setSystemTime(new Date('2027-02-01T16:00:00.000Z'))
  vi.mocked(equipmentExists).mockResolvedValue(true)
})

it('vincula a reserva à conta autenticada e normaliza as datas para UTC', async () => {
  vi.mocked(insertReservation).mockResolvedValue(item)
  const response = await create()
  expect(response.status).toBe(201)
  expect(response.body).toEqual({
    id: item.id, equipmentId, isMine: true,
    startsAt: '2027-02-01T17:00:00.000Z', endsAt: '2027-02-01T18:00:00.000Z'
  })
  expect(insertReservation).toHaveBeenCalledWith({ equipmentId, userId, startsAt: item.startsAt, endsAt: item.endsAt })
})

it('consulta a agenda e indica titularidade sem divulgar o responsável', async () => {
  vi.mocked(listReservations).mockResolvedValue([item, { ...item, userId: anotherUser }])
  const response = await request(app).get(agenda).set('X-Recognized-Test-Account', 'yes')
  expect(response.status).toBe(200)
  expect(response.body).toEqual([true, false].map((isMine) => ({
    id: item.id, equipmentId, startsAt: item.startsAt.toISOString(), endsAt: item.endsAt.toISOString(), isMine
  })))
  expect(listReservations).toHaveBeenCalledWith(equipmentId, new Date('2027-02-01T16:00:00.000Z'))
})

it('devolve lista vazia quando não há ocupação vigente', async () => {
  vi.mocked(listReservations).mockResolvedValue([])
  const response = await request(app).get(agenda).set('X-Recognized-Test-Account', 'yes')
  expect(response.body).toEqual([])
})

it('rejeita acesso sem identidade de autenticação', async () => {
  const response = await request(app).get(agenda)
  expect(response.status).toBe(401)
  expect(response.body.code).toBe('AUTH_REQUIRED')
  expect(equipmentExists).not.toHaveBeenCalled()
})

it('recusa um identificador de equipamento malformado', async () => {
  const response = await request(app).get('/api/equipment/invalid/reservations').set('X-Recognized-Test-Account', 'yes')
  expect(response.status).toBe(400)
  expect(response.body.code).toBe('EQUIPMENT_INVALID')
})

it.each([
  ['23P01', 'reservation_equipment_period_excl', 409, 'RESERVATION_CONFLICT'],
  ['23503', 'reservation_equipment_id_fk', 404, 'EQUIPMENT_NOT_FOUND'],
  ['23503', 'reservation_user_id_fk', 500, 'RESERVATION_ERROR'],
  ['23P01', 'outra_restricao', 500, 'RESERVATION_ERROR']
])('mapeia a falha %s da restrição %s sem divulgar SQL', async (code, constraint, status, publicCode) => {
  const driverError = Object.assign(new Error('driver details'), { code, constraint })
  vi.mocked(insertReservation).mockRejectedValue(new DrizzleQueryError('private SQL', [], driverError))
  const response = await create()
  expect(response.status).toBe(status)
  expect(response.body.code).toBe(publicCode)
  expect(response.text).not.toMatch(/private SQL|driver details/)
})

it('repete uma inserção abortada por impasse e devolve o conflito confirmado', async () => {
  vi.mocked(insertReservation)
    .mockRejectedValueOnce(Object.assign(new Error('deadlock'), { code: '40P01' }))
    .mockRejectedValueOnce(Object.assign(new Error('exclusion'), {
      code: '23P01', constraint: 'reservation_equipment_period_excl'
    }))
  const response = await create()
  expect(response.status).toBe(409)
  expect(response.body.code).toBe('RESERVATION_CONFLICT')
  expect(insertReservation).toHaveBeenCalledTimes(2)
})

it('devolve 404 para equipamento inexistente antes de consultar a agenda', async () => {
  vi.mocked(equipmentExists).mockResolvedValue(false)
  const response = await request(app).get(agenda).set('X-Recognized-Test-Account', 'yes')
  expect(response.status).toBe(404)
  expect(listReservations).not.toHaveBeenCalled()
})
