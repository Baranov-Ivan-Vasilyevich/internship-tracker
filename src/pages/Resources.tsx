// Every link from resources.json in one searchable list.
import { useState } from 'react'
import { EmptyState, ExternalLink, TrackTags, VerifiedBadge, inputClass } from '../components/ui'
import { RESOURCES, TRACKS, tracksUsing } from '../seed'
import { RESOURCE_TYPES } from '../types'

type Filters = { search: string; type: string; track: string; lang: string; cost: string }
const NO_FILTERS: Filters = { search: '', type: 'all', track: 'all', lang: 'all', cost: 'all' }

export default function Resources() {
  const [f, setF] = useState<Filters>(NO_FILTERS)
  const set = (k: keyof Filters, v: string) => setF({ ...f, [k]: v })

  const rows = RESOURCES.map((r) => ({ ...r, tracks: tracksUsing(r.id) })).filter((r) => {
    const q = f.search.trim().toLowerCase()
    if (q && !`${r.title} ${r.url ?? ''} ${r.id}`.toLowerCase().includes(q)) return false
    if (f.type !== 'all' && r.type !== f.type) return false
    if (f.track !== 'all' && !r.tracks.includes(f.track)) return false
    // "RU/EN" counts as both Russian and English
    if (f.lang === 'none' && r.lang !== null) return false
    if (f.lang !== 'all' && f.lang !== 'none' && !(r.lang ?? '').split('/').includes(f.lang)) return false
    if (f.cost === 'none' && r.cost !== null) return false
    if (f.cost !== 'all' && f.cost !== 'none' && r.cost !== f.cost) return false
    return true
  })

  const select = (k: keyof Filters, label: string, options: [string, string][]) => (
    <select aria-label={label} value={f[k]} onChange={(e) => set(k, e.target.value)} className={inputClass}>
      {options.map(([value, text]) => (
        <option key={value} value={value}>
          {text}
        </option>
      ))}
    </select>
  )

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Resource library</h1>

      <div className="flex flex-wrap gap-2 text-sm">
        <input
          type="search"
          aria-label="Search resources"
          placeholder="Search…"
          value={f.search}
          onChange={(e) => set('search', e.target.value)}
          className={`${inputClass} w-full sm:w-56`}
        />
        {select('type', 'Type', [['all', 'All types'], ...RESOURCE_TYPES.map((t): [string, string] => [t, t])])}
        {select('track', 'Track', [
          ['all', 'All tracks'],
          ...TRACKS.map((t): [string, string] => [t.id, t.id === 'foundation' ? 'Foundation' : `Track ${t.id}`]),
        ])}
        {select('lang', 'Language', [
          ['all', 'Any language'],
          ['RU', 'Russian'],
          ['EN', 'English'],
          ['none', 'Not set'],
        ])}
        {select('cost', 'Cost', [
          ['all', 'Free or paid'],
          ['free', 'Free'],
          ['paid', 'Paid'],
          ['none', 'Not set'],
        ])}
        {JSON.stringify(f) !== JSON.stringify(NO_FILTERS) && (
          <button onClick={() => setF(NO_FILTERS)} className="px-2 text-slate-500 underline">
            Clear
          </button>
        )}
        <span className="self-center text-slate-500" aria-live="polite">
          {rows.length} of {RESOURCES.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState>No resources match these filters.</EmptyState>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="min-w-0 flex-1">
                {r.url ? (
                  <ExternalLink href={r.url} className="font-medium">
                    {r.title}
                  </ExternalLink>
                ) : (
                  <span className="font-medium">{r.title}</span>
                )}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{r.type}</span>
                  {r.lang && <span>· {r.lang}</span>}
                  {r.cost && (
                    <span className={r.cost === 'paid' ? 'text-amber-700 dark:text-amber-400' : ''}>· {r.cost}</span>
                  )}
                  {r.url ? <VerifiedBadge verified={r.verified} /> : <span>· no link</span>}
                </div>
              </div>
              {r.tracks.length > 0 && <TrackTags tracks={r.tracks.map((t) => (t === 'foundation' ? 'Fnd' : t))} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
