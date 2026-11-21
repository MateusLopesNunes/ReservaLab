import { setTimeout as delay } from 'node:timers/promises'
import { pool } from '../db/client.js'

export async function withRefreshRace<T>(sessionId: string, requests: () => Promise<T>): Promise<T> {
  const blocker = await pool.connect()
  let running: Promise<T> | undefined
  try {
    await blocker.query('begin')
    await blocker.query('select id from auth_session where id = $1 for update', [sessionId])
    running = requests()
    void running.catch(() => undefined)
    await waitUntilRotationsOverlap()
    await blocker.query('commit')
    return await running
  } finally {
    try {
      await blocker.query('rollback')
      if (running) await running.catch(() => undefined)
    } finally {
      blocker.release()
    }
  }
}

async function waitUntilRotationsOverlap(): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await pool.query(`select pid from pg_stat_activity
      where datname = current_database() and pid <> pg_backend_pid() and wait_event_type = 'Lock'
      and query like 'select % from "auth_session"% for update'`)
    if (result.rows.length === 2) return
    await delay(50)
  }
  throw new Error('As duas renovações não chegaram simultaneamente ao PostgreSQL.')
}
