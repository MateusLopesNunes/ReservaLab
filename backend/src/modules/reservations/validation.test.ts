import express from 'express'
import request from 'supertest'
import { beforeEach, expect, it, vi } from 'vitest'
import { equipmentExists, insertReservation } from './data/reservationRepository.js'
import { reservationsRouter } from './routes.js'

vi.mock('./data/reservationRepository.js', () => ({
  equipmentExists: vi.fn(), insertReservation: vi.fn(), listReservations: vi.fn()
}))

const id = 'd5c48d1f-a1b9-4fd2-b65e-718943a1bc57'
const payload = { startsAt: '2027-02-01T14:00:00.000-03:00', endsAt: '2027-02-01T15:00:00.000-03:00' }

const app = express()
app.use(express.json())
app.use('/api/equipment/:equipmentId/reservations', (_req, res, next) => {
  res.locals.auth = { userId: id }
  next()
}, reservationsRouter)

const create = (body: object) => request(app).post(`/api/equipment/${id}/reservations`).send(body)

beforeEach(() => {
  vi.resetAllMocks()
  vi.setSystemTime(new Date('2027-02-01T16:00:00.000Z'))
  vi.mocked(equipmentExists).mockResolvedValue(true)
})

it.each([
  { ...payload, userId: id },
  { ...payload, startsAt: '2027-02-01T14:00:00' },
  { ...payload, startsAt: '2027-02-29T14:00:00Z' },
  { ...payload, startsAt: '2027-02-01T14:00:00.0003-03:00' },
  { ...payload, startsAt: '0000-02-01T14:00:00Z' },
  { ...payload, startsAt: '9999-12-31T23:59:59-01:00' },
  { startsAt: payload.startsAt }
])('rejeita formato ou campos indevidos em %j antes de tocar o banco', async (body) => {
  const response = await create(body)
  expect(response.status).toBe(400)
  expect(response.body.code).toBe('RESERVATION_INVALID')
  expect(equipmentExists).not.toHaveBeenCalled()
})

it.each([
  { ...payload, startsAt: '2027-02-01T16:00:00Z' },
  { ...payload, startsAt: '2027-02-01T15:59:59.999Z' },
  { ...payload, endsAt: payload.startsAt },
  { ...payload, endsAt: '2027-02-01T16:59:59.999Z' }
])('rejeita períodos fora dos limites em %j', async (body) => {
  const response = await create(body)
  expect(response.status).toBe(400)
  expect(response.body.code).toBe('RESERVATION_PERIOD_INVALID')
  expect(insertReservation).not.toHaveBeenCalled()
})

it('não tenta criar uma reserva para um equipamento inexistente', async () => {
  vi.mocked(equipmentExists).mockResolvedValue(false)
  const response = await create(payload)
  expect(response.status).toBe(404)
  expect(insertReservation).not.toHaveBeenCalled()
})
