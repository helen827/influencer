type DuckResult = {
  title: string
  url: string
  snippet: string
}

/** 优先使用 duckduckgo-search 包，超时或失败时回退到 HTML 解析 */
export async function duckDuckGoSearch(
  query: string,
  opts: { maxResults?: number; timeoutMs?: number } = {}
): Promise<DuckResult[]> {
  const maxResults = opts.maxResults ?? 8
  const timeoutMs = opts.timeoutMs ?? 10_000

  const withTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
    Promise.race([
      p,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ])

  try {
    const ddg = await import('duckduckgo-search')
    const api = ddg.default ?? ddg
    const out: DuckResult[] = []
    await withTimeout(
      (async () => {
        for await (const row of api.text(query, 'wt-wt', 'moderate')) {
          if (out.length >= maxResults) break
          const title = (row.title ?? '').trim()
          const url = (row.href ?? row.url ?? '').trim()
          const snippet = ((row.body ?? row.snippet ?? '') as string).trim().slice(0, 300)
          if (url && title) {
            out.push({ title, url, snippet })
          }
        }
      })(),
      timeoutMs
    )
    if (out.length > 0) return out
  } catch {
    // fallback
  }

  return duckDuckGoSearchHtml(query, opts)
}

function decodeHtml(input: string): string {
  return input
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ')
}

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, '')
}

function safeUrlDecode(input: string): string {
  try {
    return decodeURIComponent(input)
  } catch {
    return input
  }
}

function normalizeDuckUrl(href: string): string {
  try {
    const u = new URL(href, 'https://duckduckgo.com')
    const uddg = u.searchParams.get('uddg')
    if (uddg) return safeUrlDecode(uddg)
    return u.toString()
  } catch {
    return href
  }
}

async function duckDuckGoSearchHtml(
  query: string,
  opts: { maxResults?: number; timeoutMs?: number } = {}
): Promise<DuckResult[]> {
  const maxResults = opts.maxResults ?? 8
  const timeoutMs = opts.timeoutMs ?? 12_000
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html'
      },
      signal: controller.signal
    })
    if (!res.ok) return []
    const html = await res.text()

    const out: DuckResult[] = []
    const seen = new Set<string>()

    function pushResult(href: string, title: string, snippet: string) {
      const url2 = href.startsWith('http') ? href : normalizeDuckUrl(href)
      if (!url2 || seen.has(url2) || !title.trim()) return
      seen.add(url2)
      out.push({
        title: title.trim(),
        url: url2,
        snippet: (snippet || '').trim().slice(0, 300)
      })
    }

    const anchorRe =
      /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g
    let m: RegExpExecArray | null
    while ((m = anchorRe.exec(html)) && out.length < maxResults) {
      const href = decodeHtml(m[1] ?? '')
      const titleHtml = m[2] ?? ''
      const title = decodeHtml(stripTags(titleHtml)).trim()
      const start = m.index
      const window = html.slice(start, start + 1200)
      const snipMatch = window.match(
        /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/
      )
      const snippet = snipMatch ? decodeHtml(stripTags(snipMatch[1] ?? '')).trim() : ''
      pushResult(href, title, snippet)
    }

    if (out.length === 0) {
      const linkBlockRe =
        /<a[^>]*class="[^"]*result__url[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
      while ((m = linkBlockRe.exec(html)) && out.length < maxResults) {
        const href = decodeHtml(m[1] ?? '')
        if (!href.startsWith('http')) continue
        const title = decodeHtml(stripTags(m[2] ?? '')).trim()
        const start = m.index
        const window = html.slice(Math.max(0, start - 200), start + 800)
        const snippetMatch = window.match(
          /<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/i
        )
        const snippet = snippetMatch
          ? decodeHtml(stripTags(snippetMatch[1] ?? '')).trim()
          : ''
        pushResult(href, title || href, snippet)
      }
    }

    if (out.length === 0 && html.includes('result')) {
      const genericRe = /<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
      while ((m = genericRe.exec(html)) && out.length < maxResults) {
        const href = decodeHtml(m[1] ?? '')
        if (/duckduckgo\.com\/l\?|duckduckgo\.com\/\?/.test(href)) continue
        const title = decodeHtml(stripTags(m[2] ?? '')).trim().slice(0, 200)
        if (title.length < 2) continue
        pushResult(href, title, '')
      }
    }

    return out
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}
