import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import app from '../app.js'
import { pool } from '../db/client.js'
import { withReservationRace } from './reservationGate.js'
import { createEquipment, createSession } from './sessionFixture.js'

let first: Awaited<ReturnType<typeof createSession>>
let second: Awaited<ReturnType<typeof createSession>>
let equipmentId: string

beforeAll(async () => {
  first = await createSession()
  second = await createSession()
  equipmentId = await createEquipment(first.token)
})
afterAll(async () => pool.end())

function timestamp(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString()
}

function post(id: string, token: string, body: unknown) {
  return request(app).post(`/api/equipment/${id}/reservations`).auth(token, { type: 'bearer' }).send(body as object)
}

function agenda(id: string, token: string) {
  return request(app).get(`/api/equipment/${id}/reservations`).auth(token, { type: 'bearer' })
}

describe('reservas com PostgreSQL', () => {
  it.runIf(process.env.RESERVALAB_TEST_LEGACY_EQUIPMENT === '1')(
    'preserva equipamentos anteriores às migrations da demanda', async () => {
      const list = await request(app).get('/api/equipment').auth(first.token, { type: 'bearer' }).expect(200)
      expect(list.body).toEqual(expect.arrayContaining([expect.objectContaining({
        name: 'Equipamento da base anterior'
      })]))
    })


  it('permite adjacência e separa equipamentos, sem expor o responsável de outra conta', async () => {
    const startsAt = timestamp(24), boundary = timestamp(25), endsAt = timestamp(26)
    await post(equipmentId, first.token, { startsAt, endsAt: boundary }).expect(201)
    await post(equipmentId, second.token, { startsAt: boundary, endsAt }).expect(201)
    const anotherId = await createEquipment(first.token)
    await post(anotherId, first.token, { startsAt, endsAt: boundary }).expect(201)
    const list = await agenda(equipmentId, first.token).expect(200)
    expect(list.body).toEqual([
      { id: expect.any(String), equipmentId, startsAt, endsAt: boundary, isMine: true },
      { id: expect.any(String), equipmentId, startsAt: boundary, endsAt, isMine: false }
    ])
    const result = await pool.query('select user_id from reservation where equipment_id = $1 order by starts_at', [equipmentId])
    expect(result.rows.map(row => row.user_id)).toEqual([first.userId, second.userId])
  })

  it('recusa dono informado pelo cliente, intervalo ruim e equipamento inexistente', async () => {
    const startsAt = timestamp(48), endsAt = timestamp(49)
    await post(equipmentId, first.token, { startsAt, endsAt, userId: second.userId }).expect(400)
    await post(equipmentId, first.token, { startsAt: timestamp(-2), endsAt: timestamp(-1) }).expect(400)
    await post(equipmentId, first.token, { startsAt, endsAt: startsAt }).expect(400)
    await post(randomUUID(), first.token, { startsAt, endsAt }).expect(404)
    await agenda(randomUUID(), first.token).expect(404)
    const malformed = await agenda('%E0%A4%A', first.token).expect(400)
    expect(malformed.body.code).toBe('INVALID_REQUEST')
    expect(malformed.body.message).not.toContain('%E0%A4%A')
  })

  it('mantém apenas uma reserva diante de dois INSERTs simultâneos comprovados', async () => {
    const id = await createEquipment(first.token)
    const body = { startsAt: timestamp(72), endsAt: timestamp(73) }
    const attempts = await withReservationRace(
      () => post(id, first.token, body),
      () => post(id, second.token, body)
    )
    expect(attempts.map(result => result.status).sort()).toEqual([201, 409])
    expect((await agenda(id, first.token).expect(200)).body).toHaveLength(1)
    const result = await pool.query('select id from reservation where equipment_id = $1', [id])
    expect(result.rowCount).toBe(1)
  })
})
