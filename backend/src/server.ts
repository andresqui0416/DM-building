import 'dotenv/config'
import { createServer } from 'http'
import { createApp } from './app'

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000

const app = createApp()
const httpServer = createServer(app)

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[backend] Listening on http://localhost:${PORT}`)
})


