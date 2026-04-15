import type { Request, Response } from 'express'
import { resolveLlm } from './llmConfig.js'
import { parseQuestions } from './parseQuestionsJson.js'
import { formatHitsForPrompt, isWebSearchEnabled, webSearchMany } from './webSearch.js'
import { queriesForTopic } from './recordingSearchQueries.js'

const SYSTEM_PROMPT = `你是帮「独自录视频」的人打开话匣子的陪聊助手。用户会给你一个本期视频主题（可能是一句话）。
请生成 18～22 条引导问题，要像朋友随口聊天那样自然，不要用 VC 面试、正式采访或会议腔。
要求：
- 每条问题要短、口语、好接话；紧扣用户主题，可适当包含感受、故事、例子、对比类问题。
- 若用户消息中附带【联网检索摘要】：请把其中的具体人名、机构、数字、时间、事件等**有机融入**追问，让问题更具体、更好展开；**不要编造**摘要里未出现的信息；若摘要为空则忽略。
- 只输出一个 JSON 数组，元素为字符串（每个字符串就是一条问题）。不要 markdown、不要代码块、不要解释文字。`

export function createPromptsHandler() {
  return async (req: Request, res: Response) => {
    try {
      const topic = typeof req.body?.topic === 'string' ? req.body.topic.trim() : ''
      if (!topic || topic.length > 2000) {
        res.status(400).json({ error: '请提供主题 topic（1～2000 字）' })
        return
      }

      const target = resolveLlm()
      if (!target) {
        res.status(503).json({
          error:
            '未配置 LLM：请在 .env 中设置 QINIU_AI_API_KEY，或 CURSOR_API_KEY + CURSOR_API_BASE_URL（OpenAI 兼容），或 OPENAI_API_KEY（及可选 OPENAI_BASE_URL）。'
        })
        return
      }

      const userParts: string[] = [`【本期视频主题】\n${topic}`]

      if (isWebSearchEnabled()) {
        const queries = queriesForTopic(topic)
        const hits = await webSearchMany(queries, { maxPerQuery: 6, maxTotal: 10 })
        const block = formatHitsForPrompt(hits)
        if (block) {
          userParts.push(
            `【联网检索摘要（与主题相关；提问时请融入具体信息，勿编造）】\n${block}`
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
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.65,
          max_tokens: 2048
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
          error: `解析模型输出失败：${msg}。可尝试换模型或缩短主题后重试。`,
          raw: content.slice(0, 800)
        })
        return
      }

      res.json({ questions })
    } catch (err) {
      console.error('[api/prompts]', err)
      res.status(500).json({ error: '服务内部错误，请稍后重试。' })
    }
  }
}
