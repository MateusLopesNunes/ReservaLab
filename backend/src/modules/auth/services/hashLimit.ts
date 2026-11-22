const maxConcurrentHashes = 2

export class HashLimitError extends Error {}

export function createHashLimiter() {
  let active = 0
  return async function withHashSlot<T>(work: () => Promise<T>): Promise<T> {
    if (active >= maxConcurrentHashes) throw new HashLimitError()
    active += 1
    try {
      return await work()
    } finally {
      active -= 1
    }
  }
}
