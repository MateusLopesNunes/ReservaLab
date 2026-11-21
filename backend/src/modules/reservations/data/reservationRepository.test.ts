import { beforeEach, expect, it, vi } from 'vitest'
import { equipmentExists, insertReservation, listReservations } from './reservationRepository.js'

const mocks = vi.hoisted(() => ({ query: vi.fn() }))

vi.mock('../../../db/client.js', async () => {
  const { drizzle } = await import('drizzle-orm/node-postgres')
  const client = { query: mocks.query } as unknown as import('pg').Pool
  return { db: drizzle({ client }) }
})

const equipmentId = 'd5c48d1f-a1b9-4fd2-b65e-718943a1bc57'
const userId = '85efbb93-5fe6-47cc-93a0-4bb2491dfb81'
const reservationId = '85efbb93-5fe6-47cc-93a0-4bb2491dfb80'
const now = new Date('2027-02-01T16:00:00.001Z')
const startsAt = new Date('2027-02-01T17:00:00.001Z')
const endsAt = new Date('2027-02-01T18:00:00.002Z')
const row = [reservationId, equipmentId, userId, startsAt.toISOString(), endsAt.toISOString()]
const reservation = { id: reservationId, equipmentId, userId, startsAt, endsAt }

beforeEach(() => vi.resetAllMocks())

it('busca a existência do equipamento pelo UUID parametrizado', async () => {
  mocks.query.mockResolvedValue({ rows: [[equipmentId]] })
  await expect(equipmentExists(equipmentId)).resolves.toBe(true)
  expect(mocks.query).toHaveBeenCalledWith(expect.objectContaining({
    text: expect.stringContaining('"equipment"."id" = $1')
  }), [equipmentId, 1])
})

it('informa quando o equipamento não existe', async () => {
  mocks.query.mockResolvedValue({ rows: [] })
  await expect(equipmentExists(equipmentId)).resolves.toBe(false)
})

it('filtra período vigente do equipamento e ordena por início e UUID', async () => {
  mocks.query.mockResolvedValue({ rows: [row] })
  await expect(listReservations(equipmentId, now)).resolves.toEqual([reservation])
  expect(mocks.query).toHaveBeenCalledWith(expect.objectContaining({
    text: expect.stringContaining('"reservation"."ends_at" > $2')
  }), [equipmentId, now.toISOString()])
  expect(mocks.query).toHaveBeenCalledWith(expect.objectContaining({
    text: expect.stringContaining('order by "reservation"."starts_at" asc, "reservation"."id" asc')
  }), [equipmentId, now.toISOString()])
})

it('grava os identificadores e mantém a precisão dos instantes', async () => {
  mocks.query.mockResolvedValue({ rows: [row] })
  await expect(insertReservation({ equipmentId, userId, startsAt, endsAt })).resolves.toEqual(reservation)
  expect(mocks.query).toHaveBeenCalledWith(expect.objectContaining({
    text: expect.stringContaining('insert into "reservation"')
  }), [equipmentId, userId, startsAt.toISOString(), endsAt.toISOString()])
})

it('informa falha quando o driver não devolve a linha criada', async () => {
  mocks.query.mockResolvedValue({ rows: [] })
  await expect(insertReservation({ equipmentId, userId, startsAt, endsAt })).rejects.toThrow('não retornou')
})
