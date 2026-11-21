import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import app from '../app.js'
import { pool } from '../db/client.js'
import { withRefreshRace } from './refreshGate.js'
import { createSession, origin, profile, responseCookie, validPassword } from './sessionFixture.js'

afterAll(async () => pool.end())

describe('autenticação com PostgreSQL', () => {
  it('preserva status público e exige JWT em equipamentos e reservas', async () => {
    await request(app).get('/api/status').expect(200)
    const anonymous = await request(app).get('/api/equipment').expect(401)
    expect(anonymous.body).toMatchObject({ code: 'AUTH_REQUIRED', message: expect.any(String) })
    const response = await request(app).get(`/api/equipment/${randomUUID()}/reservations`)
      .auth('invalid', { type: 'bearer' })
    expect(response.status).toBe(401)
    expect(response.body.code).toBe('AUTH_REQUIRED')
  })

  it('impõe unicidade de e-mail normalizado e nunca armazena a senha em texto', async () => {
    const email = `${randomUUID()}@example.com`
    const signup = (address: string) => request(app).post('/api/auth/register')
      .set('Origin', origin).send({ email: address, password: validPassword, ...profile })
    const attempts = await Promise.all([signup(email), signup(email.toUpperCase())])
    expect(attempts.map(result => result.status).sort()).toEqual([201, 409])
    const rows = await pool.query('select * from user_account where email = $1', [email])
    expect(rows.rowCount).toBe(1)
    const serialized = JSON.stringify(rows.rows)
    expect(serialized).not.toContain(validPassword)
    expect(serialized).toContain('scrypt')
  })

  it('sanitiza JSON malformado e recusa origem de sessão diferente', async () => {
    const response = await request(app).post('/api/auth/register').set('Content-Type', 'application/json')
      .send('{"password":"segredo-exemplo"')
    expect(response.status).toBe(400)
    expect(JSON.stringify(response.body)).not.toContain('segredo-exemplo')
    await request(app).post('/api/auth/login').set('Origin', 'http://example.invalid').send({}).expect(403)
  })

  it('retorna dados da própria conta e revoga a família após reuso do refresh', async () => {
    const session = await createSession()
    const me = await request(app).get('/api/auth/me').auth(session.token, { type: 'bearer' }).expect(200)
    expect(me.body).toEqual({ userId: session.userId, email: session.email, ...profile })
    const refresh = () => request(app).post('/api/auth/refresh')
      .set('Origin', origin).set('Cookie', session.cookie).send({ sessionId: session.sessionId })
    const rotated = await refresh().expect(200)
    const newCookie = responseCookie(rotated.headers)
    expect(newCookie).toMatch(/HttpOnly/i)
    expect(newCookie).not.toContain(session.cookie)
    expect(rotated.body.sessionId).toBe(session.sessionId)
    expect(rotated.body.refreshToken).toBeUndefined()
    await refresh().expect(401)
    await request(app).get('/api/auth/me').auth(rotated.body.accessToken, { type: 'bearer' }).expect(401)
  })

  it('serializa refresh simultâneo e persiste a revogação por reuso', async () => {
    const session = await createSession()
    const refresh = () => request(app).post('/api/auth/refresh')
      .set('Origin', origin).set('Cookie', session.cookie).send({ sessionId: session.sessionId })
    const attempts = await withRefreshRace(session.sessionId, async () => Promise.all([refresh(), refresh()]))
    expect(attempts.map(result => result.status).sort()).toEqual([200, 401])
    const rotated = attempts.find(result => result.status === 200)
    expect(rotated?.body.accessToken).toBeTypeOf('string')
    await request(app).get('/api/auth/me').auth(rotated?.body.accessToken, { type: 'bearer' }).expect(401)
  })

  it('não encerra a sessão do cookie de outra conta em logout divergente', async () => {
    const [first, other] = [await createSession(), await createSession()]
    const response = await request(app).post('/api/auth/logout').set('Origin', origin)
      .set('Cookie', other.cookie).auth(first.token, { type: 'bearer' })
      .send({ sessionId: first.sessionId }).expect(204)
    expect(response.headers['set-cookie']).toBeUndefined()
    await request(app).get('/api/auth/me').auth(first.token, { type: 'bearer' }).expect(401)
    await request(app).get('/api/auth/me').auth(other.token, { type: 'bearer' }).expect(200)
  })
})
