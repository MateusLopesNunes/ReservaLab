import { and, asc, eq } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { state } from './data/state.schema.js'
import { city } from './data/city.schema.js'
import { sexOption } from './data/sexOption.schema.js'

export async function listStates() {
  return db.select({ code: state.code, name: state.name }).from(state).orderBy(asc(state.name))
}

export async function listCities(stateCode: string) {
  return db.select({ id: city.id, name: city.name, stateCode: city.stateCode })
    .from(city).where(eq(city.stateCode, stateCode)).orderBy(asc(city.name), asc(city.id))
}

export async function listSexOptions() {
  return db.select({ code: sexOption.code, label: sexOption.label }).from(sexOption).orderBy(asc(sexOption.label))
}

export async function optionsExist(stateCode: string, cityId: string, sexCode: string): Promise<boolean> {
  const [validCity] = await db.select({ id: city.id }).from(city)
    .where(and(eq(city.id, cityId), eq(city.stateCode, stateCode))).limit(1)
  if (!validCity) return false
  const [validSex] = await db.select({ code: sexOption.code }).from(sexOption)
    .where(eq(sexOption.code, sexCode)).limit(1)
  return Boolean(validSex)
}
