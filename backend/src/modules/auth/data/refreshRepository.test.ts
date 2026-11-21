import { beforeEach, describe, expect, it, vi } from 'vitest'
import { rotateRefresh } from './refreshRepository.js'
import { findToken, revokeSession } from './sessionQueries.js'

const db = vi.hoisted(() => ({
  transaction: vi.fn(), lock: vi.fn(), where: vi.fn(), set: vi.fn(), values: vi.fn()
}))
vi.mock('../../../db/client.js', () => ({
  db: { transaction: db.transaction }
}))
vi.mock('./sessionQueries.js', () => ({ findToken: vi.fn(), revokeSession: vi.fn() }))

const transaction = {
  select: () => ({ from: () => ({ where: () => ({ for: db.lock }) }) }),
  update: () => ({ set: db.set }),
  insert: () => ({ values: db.values })
}

const active = { id: 'sessão-a', userId: 'conta-a', expiresAt: new Date('2090-01-01Z'), revokedAt: null }
const original = { digest: 'original', sessionId: active.id, consumedAt: null }
const input = { digest: 'original', replacementDigest: 'substituto', expectedSessionId: active.id }

beforeEach(() => {
  vi.resetAllMocks()
  db.transaction.mockImplementation((run: (tx: typeof transaction) => unknown) => run(transaction))
  db.lock.mockResolvedValue([active])
  db.set.mockReturnValue({ where: db.where })
  vi.mocked(findToken).mockResolvedValue(original)
})

describe('rotação de refresh', () => {
  it('consome o token somente após bloquear a sessão e salva o próximo digest', async () => {
    await expect(rotateRefresh(input)).resolves.toEqual(active)
    expect(db.lock).toHaveBeenCalledWith('update')
    expect(findToken).toHaveBeenCalledTimes(2)
    expect(db.set).toHaveBeenCalledWith({ consumedAt: expect.any(Date) })
    expect(db.values).toHaveBeenCalledWith({ digest: 'substituto', sessionId: active.id })
    expect(revokeSession).not.toHaveBeenCalled()
  })

  it('recusa sessão esperada divergente sem mexer na sessão do cookie', async () => {
    await expect(rotateRefresh({ ...input, expectedSessionId: 'sessão-b' })).resolves.toBeNull()
    expect(db.lock).not.toHaveBeenCalled()
    expect(revokeSession).not.toHaveBeenCalled()
    expect(db.set).not.toHaveBeenCalled()
  })

  it('não renova sessão expirada ou revogada', async () => {
    db.lock.mockResolvedValueOnce([{ ...active, expiresAt: new Date(0) }])
      .mockResolvedValueOnce([{ ...active, revokedAt: new Date(0) }])
    await expect(rotateRefresh(input)).resolves.toBeNull()
    await expect(rotateRefresh(input)).resolves.toBeNull()
    expect(db.values).not.toHaveBeenCalled()
  })

  it('devolve falha sem abortar transação que revogou a família por replay', async () => {
    vi.mocked(findToken).mockResolvedValueOnce(original)
      .mockResolvedValueOnce({ ...original, consumedAt: new Date(0) })
    await expect(rotateRefresh(input)).resolves.toBeNull()
    expect(revokeSession).toHaveBeenCalledWith(transaction, active.id, expect.any(Date))
    expect(db.values).not.toHaveBeenCalled()
  })
})
