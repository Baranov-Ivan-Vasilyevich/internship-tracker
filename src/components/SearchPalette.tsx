// Global search (Cmd+K on Mac, Ctrl+K on Windows, or the search button in the header).
// Type a few words; every word must appear somewhere in the item. ↑/↓ to move, Enter to open, Esc to close.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LEARNING, PROJECTS, RESOURCES, trackLabel } from '../seed'
import { useEvents, useInternships } from '../state/hooks'

type Hit = { key: string; kind: string; title: string; detail: string; go: () => void }

const MAX_RESULTS = 20

export function SearchPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { rows: internships } = useInternships()
  const { rows: events } = useEvents()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  const open = (path: string) => () => {
    navigate(path)
    onClose()
  }

  // Everything that can be found, with the text that is searched
  const all: (Hit & { text: string })[] = [
    ...internships.map((i) => ({
      key: `i-${i.id}`,
      kind: 'Internship',
      title: `${i.company}${i.role ? `: ${i.role}` : ''}`,
      detail: `${i.state.status} · ${i.whatYouDo}`,
      // the id (e.g. tedo-validation) lets you find Cyrillic names by typing in Latin
      text: `${i.id} ${i.company} ${i.role} ${i.whatYouDo} ${i.state.notes}`,
      go: open(`/internships/${i.id}`),
    })),
    ...LEARNING.map((l) => ({
      key: `l-${l.id}`,
      kind: 'Task',
      title: l.title,
      detail: `${trackLabel(l.track)} · ${l.when}`,
      text: `${l.title} ${l.id} ${trackLabel(l.track)}`,
      go: open(`/learning?item=${l.id}`),
    })),
    ...PROJECTS.map((p) => ({
      key: `p-${p.id}`,
      kind: 'Project',
      title: `${p.id} · ${p.title}`,
      detail: p.when,
      text: `${p.id} ${p.title} ${p.output}`,
      go: open('/projects'),
    })),
    ...events.map((e) => ({
      key: `e-${e.id}`,
      kind: 'Event',
      title: e.name,
      detail: e.info,
      text: `${e.id} ${e.name} ${e.info}`,
      go: open('/events'),
    })),
    ...RESOURCES.map((r) => ({
      key: `r-${r.id}`,
      kind: 'Resource',
      title: r.title,
      detail: [r.type, r.lang, r.cost].filter(Boolean).join(' · '),
      text: `${r.title} ${r.id} ${r.type}`,
      go: () => {
        // Resources with a link open in a new tab; books without one open the library
        if (r.url) window.open(r.url, '_blank', 'noreferrer')
        else navigate('/resources')
        onClose()
      },
    })),
  ]

  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const hits = words.length
    ? all.filter((h) => words.every((w) => h.text.toLowerCase().includes(w))).slice(0, MAX_RESULTS)
    : []

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation() // close only the search, not a panel open behind it
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, hits.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter' && hits[active]) hits[active].go()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/40 p-4 pt-[10vh]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-xl dark:bg-slate-900"
      >
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={hits.length > 0}
          aria-controls="search-results"
          aria-activedescendant={hits[active] ? `hit-${hits[active].key}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setActive(0)
          }}
          placeholder="Search internships, tasks, projects, events, resources…"
          className="w-full border-b border-slate-200 bg-transparent px-4 py-3 outline-none dark:border-slate-800"
        />
        <ul id="search-results" role="listbox" className="max-h-[60vh] overflow-y-auto py-1">
          {words.length > 0 && hits.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-500">Nothing found.</li>
          )}
          {words.length === 0 && (
            <li className="px-4 py-3 text-sm text-slate-500">
              Type to search. ↑/↓ to move, Enter to open, Esc to close.
            </li>
          )}
          {hits.map((h, n) => (
            <li
              key={h.key}
              id={`hit-${h.key}`}
              role="option"
              aria-selected={n === active}
              onMouseEnter={() => setActive(n)}
              onClick={h.go}
              className={`flex cursor-pointer items-baseline gap-3 px-4 py-2 text-sm ${
                n === active ? 'bg-slate-100 dark:bg-slate-800' : ''
              }`}
            >
              <span className="w-20 shrink-0 text-xs text-slate-500">{h.kind}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{h.title}</span>
                {h.detail && <span className="block truncate text-xs text-slate-500">{h.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
