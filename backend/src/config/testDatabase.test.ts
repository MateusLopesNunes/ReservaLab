import { describe, expect, it } from 'vitest'
import { getIsolatedDatabaseUrl } from './testDatabase.js'

const url = 'postgresql://reservalab_test:example@127.0.0.1:49160/reservalab_test_abcdef123456'
const environment = {
  RESERVALAB_TEST_MODE: '1',
  RESERVALAB_TEST_DATABASE_NAME: 'reservalab_test_abcdef123456',
  RESERVALAB_TEST_DATABASE_PORT: '49160',
  TEST_DATABASE_URL: url,
  DATABASE_URL: url
}

describe('getIsolatedDatabaseUrl', () => {
  it('aceita apenas a URL preparada pelo provisionador', () => {
    expect(getIsolatedDatabaseUrl(environment)).toBe(url)
  })

  it.each([
    { TEST_DATABASE_URL: undefined },
    { RESERVALAB_TEST_MODE: undefined },
    { DATABASE_URL: 'postgresql://dev:fake@localhost:5433/reservalab' },
    { RESERVALAB_TEST_DATABASE_PORT: '5433' },
    { RESERVALAB_TEST_DATABASE_NAME: 'reservalab' },
    { TEST_DATABASE_URL: 'invalid', DATABASE_URL: 'invalid' },
    { TEST_DATABASE_URL: `${url}?application_name=unexpected`, DATABASE_URL: `${url}?application_name=unexpected` },
    { TEST_DATABASE_URL: `${url}#unexpected`, DATABASE_URL: `${url}#unexpected` },
    { TEST_DATABASE_URL: url.replace('127.0.0.1', 'localhost'), DATABASE_URL: url.replace('127.0.0.1', 'localhost') }
  ])('aborta se o destino faltar ou divergir: %j', (overrides) => {
    expect(() => getIsolatedDatabaseUrl({ ...environment, ...overrides })).toThrow()
  })
})
