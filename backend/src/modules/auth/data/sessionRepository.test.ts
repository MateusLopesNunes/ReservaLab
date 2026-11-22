import { beforeEach, describe, expect, it, vi } from 'vitest'
import { endSession, sessionIsActive, startSession } from './sessionRepository.js'
import { findToken, revokeSession } from './sessionQueries.js'

const db = vi.hoisted(() => ({ transaction: vi.fn(), where: vi.fn(), values: vi.fn(), returning: vi.fn() }))
const transaction = {
  select: () => ({ from: () => ({ where: db.where }) }),
  insert: () => ({ values: db.values })
}
vi.mock('../../../db/client.js', () => ({
  db: { transaction: db.transaction, select: () => transaction.select() }
}))
vi.mock('./sessionQueries.js', () => ({ findToken: vi.fn(), revokeSession: vi.fn() }))

const identity = { userId: 'conta-a', sessionId: 'sessão-a' }
const expiresAt = new Date('2090-01-01Z')
const session = { id: identity.sessionId, userId: identity.userId, expiresAt, revokedAt: null }
const foreign = { digest: 'digest-b', sessionId: 'sessão-b', consumedAt: null }

beforeEach(() => {
  vi.resetAllMocks()
  db.transaction.mockImplementation((run: (tx: typeof transaction) => unknown) => run(transaction))
  db.where.mockResolvedValue([{ id: identity.sessionId }])
  db.values.mockReturnValue({ returning: db.returning })
  db.returning.mockResolvedValue([session])
})

describe('sessões persistidas', () => {
  it('substitui sessão de navegador anterior e salva sessão e digest dentro da transação', async () => {
    vi.mocked(findToken).mockResolvedValue(foreign)
    const result = await startSession({ userId: identity.userId, digest: 'digest-a', expiresAt, previousDigest: 'digest-b' })
    expect(result).toEqual(session)
    expect(revokeSession).toHaveBeenCalledWith(transaction, foreign.sessionId, expect.any(Date))
    expect(db.values).toHaveBeenCalledWith({ digest: 'digest-a', sessionId: identity.sessionId })
  })

  it('só reconhece conta cuja sessão está ativa na consulta', async () => {
    await expect(sessionIsActive(identity)).resolves.toBe(true)
    db.where.mockResolvedValueOnce([])
    await expect(sessionIsActive(identity)).resolves.toBe(false)
  })

  it('revoga a sessão do Bearer sem limpar cookie que pertence a outra conta', async () => {
    vi.mocked(findToken).mockResolvedValue(foreign)
    const result = await endSession({ bearer: identity, digest: foreign.digest, expectedSessionId: identity.sessionId })
    expect(result).toBe(false)
    expect(revokeSession).toHaveBeenCalledExactlyOnceWith(transaction, identity.sessionId, expect.any(Date))
  })

  it('só usa a credencial do cookie se pertencer à sessão esperada', async () => {
    vi.mocked(findToken).mockResolvedValue(foreign)
    const input = { bearer: null, digest: foreign.digest, expectedSessionId: identity.sessionId }
    await expect(endSession(input)).resolves.toBe(false)
    expect(revokeSession).not.toHaveBeenCalled()
    input.expectedSessionId = foreign.sessionId
    await expect(endSession(input)).resolves.toBe(true)
    expect(revokeSession).toHaveBeenCalledExactlyOnceWith(transaction, foreign.sessionId, expect.any(Date))
  })

  it('não revoga a sessão se o owner indicado pelo Bearer não corresponder', async () => {
    db.where.mockResolvedValue([])
    const input = { bearer: identity, digest: undefined, expectedSessionId: identity.sessionId }
    await expect(endSession(input)).resolves.toBe(false)
    expect(revokeSession).not.toHaveBeenCalled()
  })
})
