import { setTimeout as delay } from 'node:timers/promises'
import { pool } from '../db/client.js'

export async function removeCityDuringRegistration<T>(cityId: string, request: () => PromiseLike<T>): Promise<T> {
  const client = await pool.connect()
  let pending: Promise<T> | undefined
  try {
    await client.query('begin')
    await client.query('select id from city where id = $1 for update', [cityId])
    pending = Promise.resolve(request())
    void pending.catch(() => undefined)
    await waitForBlockedInsert()
    await client.query('delete from city where id = $1', [cityId])
    await client.query('commit')
    return await pending
  } finally {
    try {
      await client.query('rollback')
      if (pending) await pending.catch(() => undefined)
    } finally {
      client.release()
    }
  }
}

async function waitForBlockedInsert(): Promise<void> {
  for (let attempt = 0; attempt < 160; attempt++) {
    const result = await pool.query(`select pid from pg_stat_activity
      where datname = current_database() and pid <> pg_backend_pid() and wait_event_type = 'Lock'
      and query like 'insert into "user_account"%'`)
    if (result.rowCount) return
    await delay(50)
  }
  throw new Error('Cadastro não alcançou o bloqueio de chave estrangeira.')
}
