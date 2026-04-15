const QINIU_CHAT_BASE = 'https://api.qnaigc.com/v1'

export type LlmTarget = {
  url: string
  apiKey: string
  model: string
}

function stripBearer(key: string): string {
  return key.replace(/^bearer\s+/i, '').trim()
}

/** 与 MeetingPilot 一致：优先七牛，其次 Cursor/OpenAI 兼容 */
export function resolveLlm(): LlmTarget | null {
  const qiniuKey = process.env.QINIU_AI_API_KEY?.trim()
  if (qiniuKey) {
    const model = (process.env.QINIU_LLM_MODEL || 'deepseek-v3').trim()
    return {
      url: `${QINIU_CHAT_BASE}/chat/completions`,
      apiKey: stripBearer(qiniuKey),
      model
    }
  }
  const cursorKey = process.env.CURSOR_API_KEY?.trim()
  const cursorBase = process.env.CURSOR_API_BASE_URL?.trim()
  if (cursorKey && cursorBase) {
    const base = cursorBase.replace(/\/$/, '')
    const model = (process.env.CURSOR_LLM_MODEL || 'gpt-4o-mini').trim()
    return {
      url: `${base}/chat/completions`,
      apiKey: stripBearer(cursorKey),
      model
    }
  }
  const openaiKey = process.env.OPENAI_API_KEY?.trim()
  if (openaiKey) {
    const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')
    const model = (process.env.OPENAI_MODEL || 'gpt-4o-mini').trim()
    return {
      url: `${base}/chat/completions`,
      apiKey: stripBearer(openaiKey),
      model
    }
  }
  return null
}
