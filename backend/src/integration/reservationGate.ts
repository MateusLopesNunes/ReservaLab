import { setTimeout as delay } from 'node:timers/promises'
import { pool } from '../db/client.js'

const lockId = 7481296
type Attempt<T> = () => PromiseLike<T>

export async function withReservationRace<T>(first: Attempt<T>, second: Attempt<T>): Promise<[T, T]> {
  const blocker = await pool.connect()
  const pending: Promise<T>[] = []
  let unlock = false
  try {
    await blocker.query(`create function pilot_wait_for_reservation() returns trigger language plpgsql as
      $$ begin perform pg_advisory_xact_lock(${lockId}); return new; end $$`)
    await blocker.query(`create trigger pilot_reservation_barrier after insert on reservation
      for each row execute function pilot_wait_for_reservation()`)
    await blocker.query('select pg_advisory_lock($1)', [lockId])
    unlock = true
    const firstRequest = Promise.resolve(first())
    pending.push(firstRequest)
    void firstRequest.catch(() => undefined)
    await waitForInsertLock('advisory')
    const secondRequest = Promise.resolve(second())
    pending.push(secondRequest)
    void secondRequest.catch(() => undefined)
    await waitForInsertLock('transactionid')
    await blocker.query('select pg_advisory_unlock($1)', [lockId])
    unlock = false
    return await Promise.all([firstRequest, secondRequest])
  } finally {
    try {
      if (unlock) await blocker.query('select pg_advisory_unlock($1)', [lockId])
      await Promise.allSettled(pending)
      await blocker.query('drop trigger if exists pilot_reservation_barrier on reservation')
      await blocker.query('drop function if exists pilot_wait_for_reservation()')
    } finally {
      blocker.release()
    }
  }
}

async function waitForInsertLock(event: 'advisory' | 'transactionid'): Promise<void> {
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await pool.query(`select pid from pg_stat_activity
      where datname = current_database() and pid <> pg_backend_pid() and wait_event_type = 'Lock'
      and query like 'insert into "reservation"%' and wait_event = $1`, [event])
    if (result.rows.length > 0) return
    await delay(50)
  }
  throw new Error(`A inserção não alcançou o lock ${event} do teste de concorrência.`)
}
