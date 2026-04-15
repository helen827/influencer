/** 为主题预生成构建 1～2 条搜索词（偏「背景 / 近况」） */
export function queriesForTopic(topic: string): string[] {
  const t = topic.trim().slice(0, 160)
  if (!t) return []
  const q1 = `${t} 最新`
  const q2 = `${t} 背景 讨论`
  return q1 === q2 ? [q1] : [q1, q2]
}

/** 为实时转录构建 1～2 条搜索词：主题+近期口述、口述片段+近况 */
export function queriesForLive(topic: string | undefined, transcript: string): string[] {
  const tr = transcript.trim()
  const tail = tr.slice(-260)
  const out: string[] = []

  const merged =
    topic && topic.trim().length > 0
      ? `${topic.trim().slice(0, 90)} ${tail}`.trim().slice(0, 210)
      : tail.slice(0, 210)
  if (merged.length >= 10) out.push(merged)

  const tailQuery = tail.slice(-140).trim()
  if (tailQuery.length >= 12 && tailQuery !== merged.slice(-tailQuery.length)) {
    const withNews = `${tailQuery} 最新`.slice(0, 210)
    if (withNews !== merged) out.push(withNews)
  }

  return [...new Set(out.map((q) => q.trim()).filter((q) => q.length >= 8))].slice(0, 2)
}
