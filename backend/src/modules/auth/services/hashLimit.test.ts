import { describe, expect, it } from 'vitest'
import { createHashLimiter, HashLimitError } from './hashLimit.js'

describe('limite de hashes', () => {
  it('recusa terceiro trabalho simultâneo e libera o limite após término', async () => {
    const schedule = createHashLimiter()
    let release: (value: string) => void = () => undefined
    const waiting = new Promise<string>(resolve => { release = resolve })
    const first = schedule(() => waiting)
    const second = schedule(() => waiting)
    await expect(schedule(async () => 'terceiro')).rejects.toBeInstanceOf(HashLimitError)
    release('terminado')
    await expect(Promise.all([first, second])).resolves.toEqual(['terminado', 'terminado'])
    await expect(schedule(async () => 'novo')).resolves.toBe('novo')
  })

  it('libera capacidade após falha no trabalho', async () => {
    const schedule = createHashLimiter()
    const failure = new Error('falha simulada')
    await expect(schedule(async () => { throw failure })).rejects.toBe(failure)
    await expect(Promise.all([schedule(async () => 1), schedule(async () => 2)])).resolves.toEqual([1, 2])
  })
})
