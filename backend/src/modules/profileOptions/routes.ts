import { Router } from 'express'
import { z } from 'zod'
import { listCities, listSexOptions, listStates } from './queries.js'
import { citiesSchema, sexOptionsSchema, stateCodeSchema, statesSchema } from './schemas.js'

export const profileOptionsRouter: Router = Router()

profileOptionsRouter.get('/states', async (_request, response) => {
  try {
    response.json(statesSchema.parse(await listStates()))
  } catch {
    response.status(500).json({ code: 'OPTIONS_UNAVAILABLE', message: 'Não foi possível carregar os estados.' })
  }
})

profileOptionsRouter.get('/cities', async (request, response) => {
  const input = z.strictObject({ state: stateCodeSchema }).safeParse(request.query)
  if (!input.success) {
    response.status(400).json({ code: 'INVALID_STATE', message: 'Informe um estado válido.' })
    return
  }
  try {
    response.json(citiesSchema.parse(await listCities(input.data.state)))
  } catch {
    response.status(500).json({ code: 'OPTIONS_UNAVAILABLE', message: 'Não foi possível carregar as cidades.' })
  }
})

profileOptionsRouter.get('/sexes', async (_request, response) => {
  try {
    response.json(sexOptionsSchema.parse(await listSexOptions()))
  } catch {
    response.status(500).json({ code: 'OPTIONS_UNAVAILABLE', message: 'Não foi possível carregar as opções de sexo.' })
  }
})
