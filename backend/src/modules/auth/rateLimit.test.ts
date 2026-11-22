import { describe, expect, it } from 'vitest'
import { createAttemptLimit } from './rateLimit.js'

describe('limite local de tentativas', () => {
  it('conta por origem e aceita de novo após a janela', () => {
    const canAttempt = createAttemptLimit(2)
    expect(canAttempt('a', 0)).toBe(true)
    expect(canAttempt('a', 10)).toBe(true)
    expect(canAttempt('a', 20)).toBe(false)
    expect(canAttempt('b', 20)).toBe(true)
    expect(canAttempt('a', 60_000)).toBe(true)
  })

  it('rejeita um cliente extra até liberar espaço sem perder as janelas existentes', () => {
    const canAttempt = createAttemptLimit(1)
    for (let index = 0; index < 2048; index += 1) expect(canAttempt(String(index), 0)).toBe(true)
    expect(canAttempt('novo', 1)).toBe(false)
    expect(canAttempt('0', 5)).toBe(false)
    expect(canAttempt('novo', 60_000)).toBe(true)
  })
})
