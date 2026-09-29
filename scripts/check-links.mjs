// npm run check-links
// Opens every URL in src/data/*.json and writes reports/link-report.md (+ .json).
// It NEVER changes the data files: you decide what to fix.
//
// Results:
//   ok              the page answered (2xx, or a redirect that ended in 2xx)
//   broken          the site says the page doesn't exist (404 / 410)
//   check manually  anything else: blocked, timeout, SSL error, 401/403/429/5xx…
// Some sites block scripts or fail SSL checks from other networks, so they are never
// reported as "broken", only "check manually" (see MANUAL_HOSTS).
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'

const DATA_DIR = new URL('../src/data/', import.meta.url)
const REPORT_DIR = new URL('../reports/', import.meta.url)
const TIMEOUT_MS = 15000
const PARALLEL = 5
const MANUAL_HOSTS = ['hh.ru', 'cbr.ru', 'alfabank.ru', 'rabota.vtb.ru', 'education.tbank.ru', 'career.moex.com']

const isManualHost = (url) => {
  const host = new URL(url).hostname
  return MANUAL_HOSTS.some((h) => host === h || host.endsWith('.' + h))
}

// Walk any JSON value and collect every string that looks like a URL, with where it was found
function collect(value, where, out) {
  if (typeof value === 'string' && /^https?:\/\//.test(value)) out.push({ url: value, where })
  else if (Array.isArray(value)) value.forEach((v) => collect(v, where, out))
  else if (value && typeof value === 'object') {
    const label = value.id ? `${where} › ${value.id}` : where
    Object.values(value).forEach((v) => collect(v, label, out))
  }
}

async function check(url) {
  const headers = { 'user-agent': 'Mozilla/5.0 (Macintosh) internship-tracker link check', accept: 'text/html,*/*' }
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, headers, redirect: 'follow', signal: AbortSignal.timeout(TIMEOUT_MS) })
      // Some servers refuse HEAD; try GET before judging
      if (method === 'HEAD' && res.status >= 400) continue
      if (res.ok) return { result: 'ok', detail: `${res.status}` }
      if ((res.status === 404 || res.status === 410) && !isManualHost(url))
        return { result: 'broken', detail: `${res.status}` }
      return { result: 'check manually', detail: `HTTP ${res.status}` }
    } catch (err) {
      if (method === 'HEAD') continue
      const reason =
        err.name === 'TimeoutError' ? `timeout after ${TIMEOUT_MS / 1000}s` : (err.cause?.code ?? err.message)
      return { result: 'check manually', detail: reason }
    }
  }
}

const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json'))
const found = []
for (const file of files) collect(JSON.parse(await readFile(new URL(file, DATA_DIR), 'utf8')), file, found)

// Check each URL once, but remember every place it's used
const byUrl = new Map()
for (const { url, where } of found) byUrl.set(url, [...(byUrl.get(url) ?? []), where])
const urls = [...byUrl.keys()]
console.log(`Checking ${urls.length} links (${found.length} uses in ${files.length} files)…`)

const results = []
let next = 0
async function worker() {
  while (next < urls.length) {
    const url = urls[next++]
    const r = await check(url)
    const manual = r.result !== 'ok' && isManualHost(url) ? ' (site often blocks scripts)' : ''
    results.push({ url, ...r, detail: r.detail + manual, usedIn: byUrl.get(url) })
    process.stdout.write(r.result === 'ok' ? '.' : r.result === 'broken' ? 'B' : '?')
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker))
console.log('\n')

const order = { broken: 0, 'check manually': 1, ok: 2 }
results.sort((a, b) => order[a.result] - order[b.result] || a.url.localeCompare(b.url))
const count = (r) => results.filter((x) => x.result === r).length
const when = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'

const md = [
  `# Link report`,
  ``,
  `Checked ${when}: **${count('ok')} ok**, **${count('check manually')} check manually**, **${count('broken')} broken**.`,
  `Nothing was changed in the data files. Open the non-ok links in your browser before editing anything.`,
  ``,
  `| Result | Link | Detail | Used in |`,
  `| --- | --- | --- | --- |`,
  ...results.map((r) => `| ${r.result} | ${r.url} | ${r.detail} | ${r.usedIn.join('<br>')} |`),
  ``,
].join('\n')

await mkdir(REPORT_DIR, { recursive: true })
await writeFile(new URL('link-report.md', REPORT_DIR), md)
await writeFile(new URL('link-report.json', REPORT_DIR), JSON.stringify({ checkedAt: when, results }, null, 2))
console.log(`ok: ${count('ok')} · check manually: ${count('check manually')} · broken: ${count('broken')}`)
console.log('Report: reports/link-report.md')
