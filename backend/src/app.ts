import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { healthRouter } from './routes/health'
import { apiRouter } from './routes'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors())
  app.use(express.json({ limit: '2mb' }))
  app.use(morgan('dev'))

  // Routes
  app.use('/health', healthRouter)
  app.use('/api', apiRouter)

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND' } })
  })

  return app
}


