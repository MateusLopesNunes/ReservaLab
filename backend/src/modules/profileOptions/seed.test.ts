import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('migração das opções de cadastro', () => {
  it('executa exatamente a mesma carga inicial que o script de seed', async () => {
    const migration = await readFile(new URL('../../../drizzle/0003_cadastro_opcoes.sql', import.meta.url), 'utf8')
    const seed = await readFile(new URL('../../../drizzle/seeds/0001_profile_options.sql', import.meta.url), 'utf8')
    const start = '-- BEGIN PROFILE OPTIONS SEED\n'
    const end = '-- END PROFILE OPTIONS SEED'
    expect(migration.split(start)).toHaveLength(2)
    const section = migration.split(start)[1]
    expect(section?.split(end)).toHaveLength(2)
    expect(section?.split(end)[0]).toBe(seed)
  })
})
