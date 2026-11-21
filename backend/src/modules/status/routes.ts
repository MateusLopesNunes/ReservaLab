import { Router, type Request, type Response } from 'express'
import type { StatusResponse } from './types/StatusResponse.js'

const router: Router = Router()

router.get('/', (_request: Request, response: Response<StatusResponse>): void => {
  response.json({
    status: 'ok',
    message: 'API do ReservaLab funcionando!'
  })
})

export default router
