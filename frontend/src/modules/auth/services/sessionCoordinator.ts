import { z } from 'zod'
import type { LoginInput, Session } from '../schemas/authSchema'
import { requestLogin, requestLogout, requestRefresh } from './sessionApi'
import { invalidatePending, isCurrent, replaceSession, sameSession, snapshotSession, type SessionSnapshot } from './sessionState'

const lockName = 'reservalab-auth-session'
const events = z.object({
  type: z.enum(['login', 'logout']),
  sessionId: z.uuid(),
  time: z.number()
})
let queue = Promise.resolve()
let refreshing: { revision: number, result: Promise<Session | null> } | undefined
let channel: BroadcastChannel | undefined
let lastLogin = 0

const now = () => performance.timeOrigin + performance.now()

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = queue.then(async (): Promise<T> => {
    if (navigator.locks) return await navigator.locks.request(lockName, operation)
    return await operation()
  })
  queue = result.then(() => undefined, () => undefined)
  return result
}

export function listenForSessionChanges(): () => void {
  if (typeof window.BroadcastChannel !== 'function') return () => undefined
  const listener = new window.BroadcastChannel(lockName)
  channel = listener
  listener.onmessage = (event: MessageEvent<unknown>) => {
    const result = events.safeParse(event.data)
    const active = snapshotSession().session
    if (!result.success || !active) return
    const { type, sessionId, time } = result.data
    if (type === 'logout' && active.sessionId === sessionId) replaceSession(null)
    if (type === 'login' && active.sessionId !== sessionId && time > lastLogin) replaceSession(null)
  }
  return () => {
    if (channel === listener) channel = undefined
    listener.close()
  }
}

export function login(input: LoginInput): Promise<void> {
  return serialize(async () => {
    const next = await requestLogin(input)
    lastLogin = now()
    replaceSession(next)
    channel?.postMessage({ type: 'login', sessionId: next.sessionId, time: lastLogin })
  })
}

export function logout(): Promise<void> {
  const active = snapshotSession().session
  if (!active) return Promise.resolve()
  invalidatePending()
  return serialize(async () => {
    await requestLogout(active)
    if (sameSession(active, snapshotSession().session)) replaceSession(null)
    channel?.postMessage({ type: 'logout', sessionId: active.sessionId, time: now() })
  })
}

export function renewSession(snapshot = snapshotSession()): Promise<Session | null> {
  if (!isCurrent(snapshot)) return Promise.resolve(null)
  if (refreshing?.revision === snapshot.revision) return refreshing.result
  const result = serialize(() => refreshWithinLock(snapshot))
  refreshing = { revision: snapshot.revision, result }
  const clear = () => { if (refreshing?.result === result) refreshing = undefined }
  void result.then(clear, clear)
  return result
}

async function refreshWithinLock(snapshot: SessionSnapshot): Promise<Session | null> {
  if (!isCurrent(snapshot)) return null
  const next = await requestRefresh(snapshot.session?.sessionId)
  if (!isCurrent(snapshot)) return null
  if (snapshot.session && !sameSession(snapshot.session, next)) {
    replaceSession(null)
    return null
  }
  if (!snapshot.session && next) lastLogin = now()
  replaceSession(next)
  return next
}
