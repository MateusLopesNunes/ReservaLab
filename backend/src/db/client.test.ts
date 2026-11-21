import { describe, expect, it, vi } from 'vitest'
import { db, pool } from './client.js'

vi.mock('../config/env.js', () => ({
  getDatabaseUrl: () => 'postgresql://user:pass@localhost:5432/test'
}))

describe('cliente Drizzle', () => {
  it('compartilha o pool configurado com o driver PostgreSQL', async () => {
    expect(db.$client).toBe(pool)
    await pool.end()
  })
})
