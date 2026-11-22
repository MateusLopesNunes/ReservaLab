import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const seedPath = fileURLToPath(new URL('../drizzle/seeds/0001_profile_options.sql', import.meta.url))
const migrationPath = fileURLToPath(new URL('../drizzle/0003_cadastro_opcoes.sql', import.meta.url))
const start = '-- BEGIN PROFILE OPTIONS SEED'
const end = '-- END PROFILE OPTIONS SEED'
const seed = (await readFile(seedPath, 'utf8')).trimEnd()
const migration = await readFile(migrationPath, 'utf8')
const begin = migration.indexOf(start)
const finish = migration.indexOf(end)
if (begin < 0 || finish <= begin || migration.indexOf(start, begin + 1) >= 0 || migration.indexOf(end, finish + 1) >= 0) {
  throw new Error('Marcadores da carga na migração são inválidos.')
}
const updated = migration.slice(0, begin) + start + '\n' + seed + '\n' + migration.slice(finish)
if (updated === migration) console.log('A carga e a migração estão sincronizadas.')
else if (process.argv.includes('--check')) {
  console.error('A carga e a migração estão diferentes.')
  process.exitCode = 1
} else {
  await writeFile(migrationPath, updated)
  console.log('A migração foi atualizada a partir da carga.')
}
