/**
 * 七牛 AI 实时语音识别（与 MeetingPilot qiniuAiAsr 协议一致）
 * 文档: https://developer.qiniu.com/aitokenapi/12981/asr-tts-ocr-api
 */
import { gzipSync, gunzipSync } from 'node:zlib'
import WebSocket from 'ws'
import { randomUUID } from 'node:crypto'

export type TranscriptSegment = {
  id: string
  t: number
  text: string
  isFinal: boolean
}

export type QiniuAiAsrOptions = {
  apiKey: string
  sampleRate?: number
  wsUrl?: string
}

export type QiniuStreamHandle = {
  sendAudio: (pcm16le: ArrayBuffer | SharedArrayBuffer | Buffer | Uint8Array) => void
  stop: () => Promise<void>
}

const PROTOCOL_VERSION = 0b0001
const FULL_CLIENT_REQUEST = 0b0001
const AUDIO_ONLY_REQUEST = 0b0010
const FULL_SERVER_RESPONSE = 0b1001
const POS_SEQUENCE = 0b0001
const JSON_SERIALIZATION = 0b0001
const GZIP_COMPRESSION = 0b0001

function generateHeader(
  messageType: number,
  flags: number = POS_SEQUENCE,
  serial: number = JSON_SERIALIZATION,
  compress: number = GZIP_COMPRESSION
): Buffer {
  const header = Buffer.alloc(4)
  header[0] = (PROTOCOL_VERSION << 4) | 1
  header[1] = (messageType << 4) | flags
  header[2] = (serial << 4) | compress
  header[3] = 0
  return header
}

function generateBeforePayload(sequence: number): Buffer {
  const buf = Buffer.alloc(4)
  buf.writeInt32BE(sequence, 0)
  return buf
}

function parseTextFromResponse(data: Buffer): string {
  try {
    if (!Buffer.isBuffer(data) || data.length < 4) return ''
    const headerSize = data[0] & 0x0f
    const messageType = data[1] >> 4
    const messageTypeSpecificFlags = data[1] & 0x0f
    const messageCompression = data[2] & 0x0f
    let payload = data.slice(headerSize * 4)
    if (messageTypeSpecificFlags & 0x01) payload = payload.slice(4)
    if (messageType === FULL_SERVER_RESPONSE && payload.length >= 4) {
      const payloadSize = payload.readInt32BE(0)
      payload = payload.slice(4, 4 + payloadSize)
    }
    if (messageCompression === GZIP_COMPRESSION) {
      payload = gunzipSync(payload)
    }
    const obj = JSON.parse(payload.toString('utf8')) as Record<string, unknown>
    const result = obj?.result as { text?: string } | undefined
    if (result?.text) return String(result.text).trim()
    const payloadMsg = obj?.payload_msg as { result?: { text?: string } } | undefined
    if (payloadMsg?.result?.text) return String(payloadMsg.result.text).trim()
    return ''
  } catch {
    return ''
  }
}

export async function startQiniuAiStreaming(
  opts: QiniuAiAsrOptions,
  onSegment: (seg: TranscriptSegment) => void
): Promise<QiniuStreamHandle> {
  const apiKey = opts.apiKey.replace(/\s+/g, ' ').trim()
  const wsUrl = opts.wsUrl ?? 'wss://api.qnaigc.com/v1/voice/asr'
  const sampleRate = opts.sampleRate ?? 16000

  if (!apiKey || !apiKey.startsWith('sk-')) {
    throw new Error('QINIU_AI_API_KEY 需为七牛 AI 推理 Key（一般以 sk- 开头）')
  }

  const ws = new WebSocket(wsUrl, {
    headers: { Authorization: `Bearer ${apiKey}` }
  })
  ws.binaryType = 'arraybuffer'

  let seq = 1
  let lastText = ''

  await new Promise<void>((resolve, reject) => {
    const onOpen = () => {
      cleanup()
      const req = {
        user: { uid: randomUUID() },
        audio: {
          format: 'pcm',
          sample_rate: sampleRate,
          bits: 16,
          channel: 1,
          codec: 'raw'
        },
        request: { model_name: 'asr', enable_punc: true }
      }
      const payload = gzipSync(Buffer.from(JSON.stringify(req), 'utf8'))
      const msg = Buffer.concat([
        generateHeader(FULL_CLIENT_REQUEST, POS_SEQUENCE, JSON_SERIALIZATION, GZIP_COMPRESSION),
        generateBeforePayload(seq),
        Buffer.alloc(4, 0),
        payload
      ])
      msg.writeInt32BE(payload.length, 8)
      ws.send(msg)
      seq += 1
      resolve()
    }
    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }
    const cleanup = () => {
      ws.off('open', onOpen)
      ws.off('error', onError)
    }
    ws.on('open', onOpen)
    ws.on('error', onError)
  })

  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.ping()
  }, 45000)
  const clearPing = () => clearInterval(pingInterval)

  ws.on('message', (data: Buffer | ArrayBuffer) => {
    const buf = Buffer.isBuffer(data) ? data : Buffer.from(data)
    const text = parseTextFromResponse(buf)
    if (!text || text === lastText) return
    lastText = text
    const now = Date.now()
    onSegment({
      id: `qiniu_ai_${now}`,
      t: now,
      text,
      isFinal: true
    })
  })

  let closedOrError = false
  const notifyDisconnect = (reason: string) => {
    if (closedOrError) return
    closedOrError = true
    const now = Date.now()
    onSegment({
      id: `qiniu_ai_${now}_disconnect`,
      t: now,
      text: reason,
      isFinal: true
    })
  }
  ws.on('close', () => {
    clearPing()
    notifyDisconnect('实时识别连接已断开。')
    void 0
  })
  ws.on('error', () => {
    clearPing()
    notifyDisconnect('实时识别连接异常。')
    void 0
  })

  const handle: QiniuStreamHandle = {
    sendAudio: (pcm16le) => {
      if (ws.readyState !== WebSocket.OPEN) return
      let chunk: Buffer
      if (Buffer.isBuffer(pcm16le)) chunk = pcm16le
      else if (pcm16le instanceof Uint8Array) chunk = Buffer.from(pcm16le)
      else chunk = Buffer.from(new Uint8Array(pcm16le as ArrayBuffer))
      const compressed = gzipSync(chunk)
      const msg = Buffer.concat([
        generateHeader(AUDIO_ONLY_REQUEST, POS_SEQUENCE, JSON_SERIALIZATION, GZIP_COMPRESSION),
        generateBeforePayload(seq),
        Buffer.alloc(4, 0),
        compressed
      ])
      msg.writeInt32BE(compressed.length, 8)
      ws.send(msg)
      seq += 1
    },
    stop: async () => {
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) return
      clearPing()
      ws.close()
      await new Promise<void>((resolve) => {
        ws.once('close', () => resolve())
        setTimeout(() => resolve(), 1000)
      })
    }
  }

  return handle
}
