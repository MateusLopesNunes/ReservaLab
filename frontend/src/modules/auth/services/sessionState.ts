import { readonly, shallowRef } from 'vue'
import type { Session } from '../schemas/authSchema'

const current = shallowRef<Session | null>(null)
let revision = 0

export const session = readonly(current)

export function snapshotSession() {
  return { session: current.value, revision }
}

export type SessionSnapshot = ReturnType<typeof snapshotSession>

export function sameSession(first: Session | null, second: Session | null): boolean {
  return first?.sessionId === second?.sessionId && first?.userId === second?.userId
}

export function isCurrent(snapshot: SessionSnapshot): boolean {
  return snapshot.revision === revision && sameSession(snapshot.session, current.value)
}

export function replaceSession(next: Session | null): void {
  if (!sameSession(current.value, next)) revision += 1
  current.value = next
}

export function invalidatePending(): void {
  revision += 1
}
