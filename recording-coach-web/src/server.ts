import 'dotenv/config'
import { createServer } from 'node:http'
import express from 'express'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { WebSocketServer } from 'ws'
import { createPromptsHandler } from './promptsApi.js'
import { createLiveQuestionsHandler } from './liveQuestionsApi.js'
import { attachAsrSocket } from './asrWebSocket.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '96kb' }))

app.post('/api/prompts', createPromptsHandler())
app.post('/api/live-questions', createLiveQuestionsHandler())

app.use(express.static(publicDir))

const port = Number(process.env.PORT) || 3847
/** 云上需监听所有网卡；仅本机可设 LISTEN_HOST=127.0.0.1 */
const listenHost = process.env.LISTEN_HOST?.trim() || '0.0.0.0'
const server = createServer(app)

const wss = new WebSocketServer({ noServer: true })
server.on('upgrade', (req, socket, head) => {
  const pathStr = req.url?.split('?')[0] ?? ''
  if (pathStr === '/ws/asr') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  } else {
    socket.destroy()
  }
})

wss.on('connection', (ws) => {
  attachAsrSocket(ws)
})

server.listen(port, listenHost, () => {
  console.log(`recording-coach-web http://${listenHost}:${port}`)
  console.log(`ASR WebSocket ws://${listenHost}:${port}/ws/asr`)
})
