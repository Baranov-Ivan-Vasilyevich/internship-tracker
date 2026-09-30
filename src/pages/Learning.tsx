import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ResourceLink } from '../components/ResourceLink'
import { TimeLogForm } from '../components/TimeLogForm'
import { Card, ProgressBar, inputClass, secondaryButtonClass } from '../components/ui'
import { currentMonth, formatDate, todayISO } from '../lib/dates'
import { hoursByItem, hoursInWeek, streak } from '../lib/timeLog'
import { LEARNING, TRACKS, isActive, projectById, testPrepForTrack } from '../seed'
import { useData } from '../state/context'
import { useEvents, useTimeLog, useToggle } from '../state/hooks'
import type { TimeEntry } from '../lib/timeLog'
import type { LearningItem, Track } from '../types'

export default function Learning() {
  const { data } = useData()
  const { rows: allEvents } = useEvents()
  const toggle = useToggle()
  const timeLog = useTimeLog()
  const perItem = hoursByItem(timeLog.entries)
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

      <TimeLogCard />

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
        const trackHours = Math.round(items.reduce((sum, i) => sum + (perItem.get(i.id) ?? 0), 0) * 100) / 100
        const events = allEvents.filter((e) => e.track === track.id)
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
              {trackHours > 0 && <span className="text-xs text-slate-500 tabular-nums">{trackHours} h</span>}
            </button>
            <ProgressBar done={trackDone} total={items.length} />

            {isOpen && track.resources.length > 0 && (
              <div className="text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">Track resources: </span>
                <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
                  {track.resources.map((id) => (
                    <ResourceLink key={id} id={id} />
                  ))}
                </span>
              </div>
            )}

            {isOpen && <TrackPrep trackId={track.id} whatTheyTest={track.whatTheyTest} />}

            {isOpen && (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item) => (
                  <LearningRow
                    key={item.id}
                    item={item}
                    done={done.has(item.id)}
                    active={isActive(item, month)}
                    onToggle={() => toggle('learningDone', item.id)}
                    hours={perItem.get(item.id) ?? 0}
                    onLog={timeLog.add}
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
                        · {e.state.status} · {e.info}
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

type RowProps = {
  item: LearningItem
  done: boolean
  active: boolean
  onToggle: () => void
  hours: number
  onLog: (entry: TimeEntry) => void
}

function LearningRow({ item, done, active, onToggle, hours, onLog }: RowProps) {
  const project = item.project ? projectById(item.project) : undefined
  const [logging, setLogging] = useState(false)
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
          {item.resources.map((id) => (
            <ResourceLink key={id} id={id} />
          ))}
          {hours > 0 && <span className="tabular-nums">{hours} h logged</span>}
          <button
            onClick={() => setLogging(!logging)}
            className="text-blue-600 hover:underline dark:text-blue-400"
            aria-expanded={logging}
          >
            + time
          </button>
        </div>
        {logging && (
          <TimeLogForm
            fixedItemId={item.id}
            onSave={(entry) => {
              onLog(entry)
              setLogging(false)
            }}
            onCancel={() => setLogging(false)}
          />
        )}
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

// Hours this week, streak, weekly target and the most recent entries (with delete)
function TimeLogCard() {
  const { entries, target, remove, setTarget } = useTimeLog()
  const today = todayISO()
  const { current, best } = streak(entries, target, today)
  const title = (id: string) => LEARNING.find((i) => i.id === id)?.title ?? 'Other / general'
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-medium">Time log</span>
        <span>
          This week: <b className="tabular-nums">{hoursInWeek(entries, today)}</b> / {target} h
        </span>
        <span>
          Streak: <b>{current}</b> {current === 1 ? 'week' : 'weeks'} (best {best})
        </span>
        <label className="ml-auto flex items-center gap-2 text-slate-500">
          Weekly target
          <input
            type="number"
            min={1}
            max={80}
            step={0.5}
            value={target}
            onChange={(e) => Number(e.target.value) > 0 && setTarget(Number(e.target.value))}
            className={`${inputClass} w-20`}
          />
          h
        </label>
      </div>
      {recent.length === 0 ? (
        <p className="text-sm text-slate-400">
          No time logged yet. Use “+ time” on an item, or the form on the Dashboard.
        </p>
      ) : (
        <ul className="space-y-1 text-sm">
          {recent.map((e) => (
            <li key={e.id} className="flex gap-2">
              <span className="w-24 shrink-0 text-slate-500">{formatDate(e.date)}</span>
              <span className="w-12 shrink-0 tabular-nums">{e.hours} h</span>
              <span className="min-w-0 flex-1 truncate" title={title(e.itemId)}>
                {title(e.itemId)}
                {e.note && <span className="text-slate-500"> · {e.note}</span>}
              </span>
              <button
                onClick={() => confirm('Delete this time entry?') && remove(e.id)}
                className="text-xs text-slate-400 hover:text-rose-600"
                aria-label={`Delete ${e.hours} h on ${formatDate(e.date)}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

// The doc's "What they test" list and the test-prep stages used by this track's programs.
// Both fold away (<details>) so the checklist stays the main thing on the page.
function TrackPrep({ trackId, whatTheyTest }: { trackId: string; whatTheyTest: Track['whatTheyTest'] }) {
  const prep = testPrepForTrack(trackId)
  if (!whatTheyTest && prep.length === 0) return null
  const summaryClass = 'cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300'
  return (
    <div className="space-y-2 rounded-md bg-slate-50 p-3 dark:bg-slate-800/50">
      {whatTheyTest && (
        <details>
          <summary className={summaryClass}>
            {whatTheyTest.title} ({whatTheyTest.items.length})
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {whatTheyTest.items.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </details>
      )}
      {prep.length > 0 && (
        <details>
          <summary className={summaryClass}>Test and interview prep ({prep.length} stages)</summary>
          <ul className="mt-2 space-y-3 text-sm">
            {prep.map((p) => (
              <li key={p.id}>
                <div className="font-medium">{p.stage}</div>
                <div className="text-xs text-slate-500">Who uses it: {p.whoUsesIt}</div>
                <div>
                  <span className="text-slate-500">How to prepare: </span>
                  {p.howToPrepare}
                  {p.resources.map((id) => (
                    <span key={id}>
                      {' · '}
                      <ResourceLink id={id} />
                    </span>
                  ))}
                </div>
                {p.note && <div className="text-xs text-amber-700 dark:text-amber-400">{p.note}</div>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
