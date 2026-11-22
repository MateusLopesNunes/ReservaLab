import { z } from 'zod'

const stateSchema = z.object({ code: z.string().length(2), name: z.string().min(1) })
const citySchema = z.object({ id: z.uuid(), name: z.string().min(1), stateCode: z.string().length(2) })
const sexSchema = z.object({ code: z.string().min(1), label: z.string().min(1) })

async function options<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) throw new Error('Não foi possível carregar as opções.')
  return schema.parse(await response.json())
}

export const listStates = () => options('/api/profile-options/states', z.array(stateSchema))
export const listSexes = () => options('/api/profile-options/sexes', z.array(sexSchema))
export const listCities = (state: string) =>
  options('/api/profile-options/cities?state=' + encodeURIComponent(state), z.array(citySchema))

export type StateOption = z.infer<typeof stateSchema>
export type CityOption = z.infer<typeof citySchema>
export type SexOption = z.infer<typeof sexSchema>
