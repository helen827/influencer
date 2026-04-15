declare module 'duckduckgo-search' {
  type TextRow = { title?: string; href?: string; url?: string; body?: string; snippet?: string }
  const api: {
    text(
      query: string,
      region?: string,
      safesearch?: string
    ): AsyncIterable<TextRow>
  }
  export default api
}
