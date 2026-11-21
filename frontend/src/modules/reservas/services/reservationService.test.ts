import { beforeEach, expect, it, vi } from 'vitest'
import { authenticatedFetch } from '../../auth/services/authenticatedFetch'
import { createReservation, listReservations } from './reservationService'

vi.mock('../../auth/services/authenticatedFetch', () => ({ authenticatedFetch: vi.fn() }))

const id = 'd5c48d1f-a1b9-4fd2-b65e-718943a1bc57'
const period = { startsAt: '2027-02-01T14:00:00.000Z', endsAt: '2027-02-01T15:00:00.000Z' }
const item = { ...period, id, equipmentId: id, isMine: true }
const path = `/api/equipment/${id}/reservations`

beforeEach(() => vi.resetAllMocks())

it('consulta a agenda pelo cliente autenticado', async () => {
  vi.mocked(authenticatedFetch).mockResolvedValue(Response.json([item]))
  await expect(listReservations(id)).resolves.toEqual([item])
  expect(authenticatedFetch).toHaveBeenCalledWith(path)
})

it('recusa um payload de agenda que contém identidade extra', async () => {
  vi.mocked(authenticatedFetch).mockResolvedValue(Response.json([{ ...item, userId: id }]))
  await expect(listReservations(id)).rejects.toThrow()
})

it('envia apenas os dados permitidos para criar a reserva', async () => {
  vi.mocked(authenticatedFetch).mockResolvedValue(Response.json(item, { status: 201 }))
  await expect(createReservation(id, period)).resolves.toEqual(item)
  expect(authenticatedFetch).toHaveBeenCalledWith(path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(period)
  })
})

it.each([
  [400, 'Informe um início futuro'],
  [404, 'Esse equipamento não está mais disponível'],
  [409, 'O equipamento já está reservado'],
  [500, 'Não foi possível criar a reserva']
])('traduz erros controlados do servidor %s sem expor seu corpo', async (status, message) => {
  vi.mocked(authenticatedFetch).mockResolvedValue(Response.json({ message: 'private details' }, { status }))
  await expect(createReservation(id, period)).rejects.toThrow(message)
})
