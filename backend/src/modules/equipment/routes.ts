import { Router, type Request, type Response } from 'express'
import { createEquipment, listEquipment } from './data/equipmentRepository.js'
import { createEquipmentSchema } from './schemas/createEquipment.js'

const router: Router = Router()

router.get('/', async (_request: Request, response: Response): Promise<void> => {
  try {
    response.json(await listEquipment())
  } catch {
    response.status(500).json({ message: 'Não foi possível listar equipamentos.' })
  }
})

router.post('/', async (request: Request, response: Response): Promise<void> => {
  const result = createEquipmentSchema.safeParse(request.body)
  if (!result.success) {
    response.status(400).json({ message: 'Dados de equipamento inválidos.', errors: result.error.issues.map(({ path, message }) => ({ field: path.join('.'), message })) })
    return
  }
  try {
    response.status(201).json(await createEquipment(result.data))
  } catch {
    response.status(500).json({ message: 'Não foi possível cadastrar equipamento.' })
  }
})

export default router
