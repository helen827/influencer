import WebSocket from 'ws'
import { startQiniuAiStreaming, type QiniuStreamHandle } from './qiniuAiAsr.js'

function safeSend(ws: WebSocket, obj: unknown) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj))
}

export function attachAsrSocket(browserWs: WebSocket) {
  let streamHandle: QiniuStreamHandle | null = null
  let starting = false

  const cleanup = async () => {
    starting = false
    if (streamHandle) {
      await streamHandle.stop().catch(() => undefined)
      streamHandle = null
    }
  }

  browserWs.on('message', async (data, isBinary) => {
    if (!isBinary) {
      let msg: { type?: string }
      try {
        msg = JSON.parse(data.toString()) as { type?: string }
      } catch {
        safeSend(browserWs, { type: 'error', message: '无效的控制消息' })
        return
      }

      if (msg.type === 'start') {
        if (starting || streamHandle) {
          safeSend(browserWs, { type: 'error', message: '已在监听中，请先停止。' })
          return
        }
        const apiKey = process.env.QINIU_AI_API_KEY?.trim()
        if (!apiKey) {
          safeSend(browserWs, {
            type: 'error',
            message: '实时听写需要在本机 .env 中配置 QINIU_AI_API_KEY（七牛 AI 推理 Key）。'
          })
          return
        }
        starting = true
        try {
          streamHandle = await startQiniuAiStreaming({ apiKey }, (seg) => {
            if (seg.id.endsWith('_disconnect')) {
              safeSend(browserWs, { type: 'asr_error', message: seg.text })
              return
            }
            safeSend(browserWs, { type: 'transcript', text: seg.text })
          })
          starting = false
          safeSend(browserWs, { type: 'asr_ready' })
        } catch (e) {
          starting = false
          streamHandle = null
          const message = e instanceof Error ? e.message : String(e)
          safeSend(browserWs, { type: 'error', message })
        }
        return
      }

      if (msg.type === 'stop') {
        await cleanup()
        safeSend(browserWs, { type: 'asr_stopped' })
        return
      }

      return
    }

    if (!streamHandle) return
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer)
    streamHandle.sendAudio(buf)
  })

  browserWs.on('close', () => {
    void cleanup()
  })
  browserWs.on('error', () => {
    void cleanup()
  })
}
