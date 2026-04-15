export function extractJsonArrayText(raw: string): string {
  let s = raw.trim()
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im
  const m = s.match(fence)
  if (m) s = m[1].trim()
  const start = s.indexOf('[')
  const end = s.lastIndexOf(']')
  if (start >= 0 && end > start) return s.slice(start, end + 1)
  return s
}

export function parseQuestions(content: string): string[] {
  const slice = extractJsonArrayText(content)
  const parsed = JSON.parse(slice) as unknown
  if (!Array.isArray(parsed)) throw new Error('模型返回不是 JSON 数组')
  const out: string[] = []
  for (const item of parsed) {
    if (typeof item !== 'string') continue
    const q = item.trim()
    if (q) out.push(q)
  }
  if (out.length === 0) throw new Error('数组里没有有效问题')
  return out
}
