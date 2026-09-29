// "https://www.cbr.ru/about_br/…" → "cbr.ru". Falls back to the text itself if it isn't a valid URL.
export function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
