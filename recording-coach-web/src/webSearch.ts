import { duckDuckGoSearch } from './duckDuckGo.js'

export type SearchHit = {
  title: string
  url: string
  snippet: string
}

export type SearchProvider = 'duckduckgo' | 'serper'

export type SearchConfig = {
  provider?: SearchProvider
  serperApiKey?: string
  serperGl?: string
  serperHl?: string
}

function getSearchConfigFromEnv(): SearchConfig {
  const provider = (process.env.SEARCH_PROVIDER?.trim() || 'duckduckgo') as SearchProvider
  return {
    provider: provider === 'serper' ? 'serper' : 'duckduckgo',
    serperApiKey: process.env.SERPER_API_KEY?.trim(),
    serperGl: process.env.SERPER_GL?.trim(),
    serperHl: process.env.SERPER_HL?.trim()
  }
}

export function isWebSearchEnabled(): boolean {
  return process.env.RECORDING_COACH_WEB_SEARCH?.trim() !== '0'
}

async function serperSearch(
  query: string,
  cfg: SearchConfig,
  opts: { maxResults?: number } = {}
): Promise<SearchHit[]> {
  const apiKey = cfg.serperApiKey?.trim()
  if (!apiKey) {
    return []
  }
  const maxResults = opts.maxResults ?? 8
  const gl = cfg.serperGl?.trim() || 'cn'
  const hl = cfg.serperHl?.trim() || 'zh-cn'

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey
      },
      body: JSON.stringify({ q: query, gl, hl })
    })
    const data = (await res.json()) as {
      organic?: Array<{ title?: string; link?: string; snippet?: string }>
      message?: string
      error?: string
    }
    if (!res.ok) {
      console.warn('[webSearch] Serper', res.status, data.message ?? data.error)
      return []
    }
    const organic = data.organic ?? []
    return organic
      .map((r) => ({
        title: (r.title ?? '').trim(),
        url: (r.link ?? '').trim(),
        snippet: (r.snippet ?? '').trim()
      }))
      .filter((r) => r.title && r.url)
      .slice(0, maxResults)
  } catch (err) {
    console.warn('[webSearch] Serper request failed:', err instanceof Error ? err.message : err)
    return []
  }
}

export async function webSearch(
  query: string,
  cfg: SearchConfig,
  opts: { maxResults?: number } = {}
): Promise<SearchHit[]> {
  const q = query.trim().slice(0, 220)
  if (!q) return []
  const provider = cfg.provider ?? 'duckduckgo'
  if (provider === 'serper') {
    const hits = await serperSearch(q, cfg, opts)
    if (hits.length > 0) return hits
    return duckDuckGoSearch(q, { maxResults: opts.maxResults })
  }
  return duckDuckGoSearch(q, { maxResults: opts.maxResults })
}

/** 合并多次搜索，按 URL 去重 */
export async function webSearchMany(
  queries: string[],
  opts: { maxPerQuery?: number; maxTotal?: number } = {}
): Promise<SearchHit[]> {
  if (!isWebSearchEnabled()) return []
  const cfg = getSearchConfigFromEnv()
  const maxPer = opts.maxPerQuery ?? 6
  const maxTotal = opts.maxTotal ?? 12
  const seen = new Set<string>()
  const out: SearchHit[] = []

  for (const raw of queries) {
    const q = raw.trim().slice(0, 220)
    if (q.length < 2) continue
    const hits = await webSearch(q, cfg, { maxResults: maxPer })
    for (const h of hits) {
      if (out.length >= maxTotal) return out
      if (seen.has(h.url)) continue
      seen.add(h.url)
      out.push(h)
    }
  }
  return out
}

export function formatHitsForPrompt(hits: SearchHit[]): string {
  if (hits.length === 0) return ''
  return hits
    .map((h, i) => {
      let host = h.url
      try {
        host = new URL(h.url).hostname
      } catch {
        void 0
      }
      const snip = h.snippet || '（无摘要）'
      return `${i + 1}. ${h.title}\n   ${snip}\n   来源: ${host}`
    })
    .join('\n\n')
}
