import type { Request, Response } from 'express'
import { resolveLlm } from './llmConfig.js'
import { parseQuestions } from './parseQuestionsJson.js'
import { formatHitsForPrompt, isWebSearchEnabled, webSearchMany } from './webSearch.js'
import { queriesForLive } from './recordingSearchQueries.js'

const LIVE_SYSTEM = `你是帮「独自录视频」的人打开话匣子的陪聊助手。你会看到对方**已经说出来的内容**的语音识别转录（可能不完整、有错字）。
请根据转录里**实际在聊的内容**，生成 6～10 条**短追问**，要像朋友随口接话，帮对方把故事讲清楚、情绪顺下去。不要用 VC 面试、正式采访或会议腔。
要求：
- 优先针对转录**末尾最近提到的点**提问，也可适度呼应前面内容。
- 若用户消息中附带【联网检索摘要】：请结合摘要里的**具体事实**（名称、数据、事件、时间等）把追问写得更具体、更有抓手；**不要编造**摘要里未出现的信息；若摘要为空则忽略。
- 每条问题短、口语、好接话。
- 只输出一个 JSON 数组，元素为字符串（每个字符串一条问题）。不要 markdown、不要代码块、不要其它解释。`

export function createLiveQuestionsHandler() {
  return async (req: Request, res: Response) => {
    try {
      const transcript =
        typeof req.body?.transcript === 'string' ? req.body.transcript.trim().slice(-8000) : ''
      const topic =
        typeof req.body?.topic === 'string' ? req.body.topic.trim().slice(0, 500) : ''

      if (transcript.length < 15) {
        res.status(400).json({ error: '转录太短（至少约 15 字），请多说几句再生成问题。' })
        return
      }

      const target = resolveLlm()
      if (!target) {
        res.status(503).json({
          error:
            '未配置 LLM：请在 .env 中设置 QINIU_AI_API_KEY，或 CURSOR_API_KEY + CURSOR_API_BASE_URL，或 OPENAI_API_KEY。'
        })
        return
      }

      const userParts: string[] = []
      if (topic) userParts.push(`【整期视频可选主题提示】\n${topic}`)
      userParts.push(`【当前已说内容（语音识别）】\n${transcript}`)

      if (isWebSearchEnabled()) {
        const queries = queriesForLive(topic || undefined, transcript)
        const hits = await webSearchMany(queries, { maxPerQuery: 6, maxTotal: 10 })
        const block = formatHitsForPrompt(hits)
        if (block) {
          userParts.push(
            `【联网检索摘要（与主题及口述相关；提问时请融入具体信息，勿编造）】\n${block}`
          )
        }
      }

      userParts.push('请按系统要求只输出 JSON 字符串数组。')
      const userPrompt = userParts.join('\n\n')

      const llmRes = await fetch(target.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${target.apiKey}`
        },
        body: JSON.stringify({
          model: target.model,
          messages: [
            { role: 'system', content: LIVE_SYSTEM },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.65,
          max_tokens: 1400
        })
      })

      if (!llmRes.ok) {
        const errText = await llmRes.text()
        res.status(502).json({
          error: `上游模型请求失败（${llmRes.status}）：${errText.slice(0, 300)}`
        })
        return
      }

      const data = (await llmRes.json()) as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = data.choices?.[0]?.message?.content?.trim()
      if (!content) {
        res.status(502).json({ error: '模型未返回内容，请重试。' })
        return
      }

      let questions: string[]
      try {
        questions = parseQuestions(content)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        res.status(502).json({
          error: `解析模型输出失败：${msg}`,
          raw: content.slice(0, 800)
        })
        return
      }

      res.json({ questions })
    } catch (err) {
      console.error('[api/live-questions]', err)
      res.status(500).json({ error: '服务内部错误，请稍后重试。' })
    }
  }
}
