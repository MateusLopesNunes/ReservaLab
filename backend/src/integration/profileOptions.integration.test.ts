import { readFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import app from '../app.js'
import { pool } from '../db/client.js'
import { removeCityDuringRegistration } from './profileOptionsGate.js'
import { origin, profile, validPassword } from './sessionFixture.js'

const ceres = '00000000-0000-4000-8000-000000000001'
const register = (data: object) => request(app).post('/api/auth/register')
  .set('Origin', origin).send({ email: `${randomUUID()}@example.test`, password: validPassword, ...profile, ...data })

afterAll(async () => pool.end())

describe('opções de cadastro no PostgreSQL isolado', () => {
  it('oferece dados públicos e aplica a carga duas vezes sem duplicação', async () => {
    const seed = await readFile(new URL('../../drizzle/seeds/0001_profile_options.sql', import.meta.url), 'utf8')
    await pool.query(seed)
    await pool.query(seed)
    const states = await request(app).get('/api/profile-options/states').expect(200)
    expect(states.body).toEqual([{ code: 'GO', name: 'Goiás' }])
    const cities = await request(app).get('/api/profile-options/cities?state=GO').expect(200)
    expect(cities.body.map((city: { name: string }) => city.name)).toEqual(['Ceres', 'Rialma'])
    expect(cities.body.every((city: { stateCode: string }) => city.stateCode === 'GO')).toBe(true)
    const sexes = await request(app).get('/api/profile-options/sexes').expect(200)
    expect(sexes.body.map((item: { label: string }) => item.label).sort())
      .toEqual(['Feminino', 'Intersexo', 'Masculino', 'Outro', 'Prefiro não informar'].sort())
  })

  it('rejeita opções inexistentes e combinação cidade/estado inválida', async () => {
    await pool.query("insert into state (code, name) values ('SP', 'São Paulo') on conflict do nothing")
    for (const invalid of [{ state: 'ZZ' }, { city: randomUUID() }, { sex: 'desconhecido' }, { state: 'SP', city: ceres }]) {
      const response = await register(invalid).expect(400)
      expect(response.text).not.toContain('insert into')
    }
  })

  it('retorna 400 se a cidade é removida durante o cadastro', async () => {
    const cityId = randomUUID()
    await pool.query("insert into city (id, name, state_code) values ($1, $2, 'GO')", [cityId, 'Cidade temporária'])
    const response = await removeCityDuringRegistration(cityId, () => register({ city: cityId }))
    expect(response.status).toBe(400)
    expect(response.text).not.toContain('insert into')
  })

  it('o banco impede associação cidade/estado divergente', async () => {
    await pool.query("insert into state (code, name) values ('SP', 'São Paulo') on conflict do nothing")
    await expect(pool.query(`insert into user_account (email, password_hash, first_name, last_name, state, city, birth_date, sex)
      values ($1, 'hash', 'Nome', 'Teste', 'SP', $2, '1990-01-01', 'feminino')`,
    [`${randomUUID()}@example.test`, ceres])).rejects.toMatchObject({ code: '23503', constraint: 'user_account_city_state_fk' })
  })
})
