import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, ProgressBar, secondaryButtonClass } from '../components/ui'
import { currentMonth } from '../lib/dates'
import { LEARNING, TRACKS, isActive, projectById } from '../seed'
import { useData, useToggle } from '../store'
import type { LearningItem } from '../types'

export default function Learning() {
  const { data } = useData()
  const toggle = useToggle()
  const done = new Set(data.learningDone)
  const month = currentMonth()

  // Which track sections are expanded. Foundation starts open.
  const [open, setOpen] = useState<Set<string>>(() => new Set(['foundation']))
  const flip = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const doneCount = LEARNING.filter((i) => done.has(i.id)).length

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Learning</h1>

      <Card>
        <div className="mb-2 text-sm font-medium">Overall progress</div>
        <ProgressBar done={doneCount} total={LEARNING.length} />
      </Card>

      <div className="flex gap-2">
        <button className={secondaryButtonClass} onClick={() => setOpen(new Set(TRACKS.map((t) => t.id)))}>
          Expand all
        </button>
        <button className={secondaryButtonClass} onClick={() => setOpen(new Set())}>
          Collapse all
        </button>
      </div>

      {TRACKS.map((track) => {
        const items = LEARNING.filter((i) => i.track === track.id)
        const trackDone = items.filter((i) => done.has(i.id)).length
        const events = data.events.filter((e) => e.track === track.id)
        const isOpen = open.has(track.id)
        return (
          <Card key={track.id} className="space-y-2">
            <button
              onClick={() => flip(track.id)}
              className="flex w-full items-center gap-2 text-left"
              aria-expanded={isOpen}
            >
              <span className="w-4 text-slate-400">{isOpen ? '▾' : '▸'}</span>
              <span className="flex-1 font-medium">{track.name}</span>
            </button>
            <ProgressBar done={trackDone} total={items.length} />

            {isOpen && (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <LearningRow
                    key={item.id}
                    item={item}
                    done={done.has(item.id)}
                    active={isActive(item, month)}
                    onToggle={() => toggle('learningDone', item.id)}
                  />
                ))}
              </ul>
            )}

            {isOpen && events.length > 0 && (
              <div className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
                <div className="mb-1 flex justify-between font-medium">
                  Championships & events
                  <Link to="/events" className="text-xs font-normal text-blue-600 hover:underline dark:text-blue-400">
                    Open events →
                  </Link>
                </div>
                <ul className="space-y-1">
                  {events.map((e) => (
                    <li key={e.id}>
                      <span className="font-medium">{e.name}</span>
                      <span className="text-slate-500">
                        {' '}
                        · {e.status} · {e.info}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

type RowProps = { item: LearningItem; done: boolean; active: boolean; onToggle: () => void }

function LearningRow({ item, done, active, onToggle }: RowProps) {
  const project = item.project ? projectById(item.project) : undefined
  return (
    <li className="flex gap-3 py-3">
      <input
        id={`learn-${item.id}`}
        type="checkbox"
        checked={done}
        onChange={onToggle}
        className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
      />
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <label htmlFor={`learn-${item.id}`} className={`block cursor-pointer ${done ? 'text-slate-400' : ''}`}>
          {item.title}
        </label>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span>{item.when}</span>
          {active && !done && (
            <span className="rounded bg-emerald-100 px-1.5 font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              now
            </span>
          )}
          {item.resources.map((r) =>
            r.url ? (
              <a
                key={r.label}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {r.label} ↗
              </a>
            ) : (
              <span key={r.label}>{r.label}</span>
            ),
          )}
        </div>
        {(item.proof || project) && (
          <div className="text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300">CV proof: </span>
            {item.proof}
            {item.proof && project && ' · '}
            {project && (
              <Link to="/projects" className="text-blue-600 hover:underline dark:text-blue-400">
                {project.id} {project.title} ({project.output})
              </Link>
            )}
          </div>
        )}
      </div>
    </li>
  )
}
