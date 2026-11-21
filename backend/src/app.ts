import express, { type Express } from 'express'
import statusRouter from './modules/status/routes.js'
import equipmentRouter from './modules/equipment/routes.js'

const app: Express = express()

app.use(express.json())

app.use('/api/status', statusRouter)
app.use('/api/equipment', equipmentRouter)

export default app
