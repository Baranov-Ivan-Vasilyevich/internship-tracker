import { useState } from 'react'
import { ResourceLink } from '../components/ResourceLink'
import {
  Card,
  CertaintyBadge,
  EmptyState,
  ExternalLink,
  TrackTags,
  buttonClass,
  inputClass,
  secondaryButtonClass,
} from '../components/ui'
import { formatDate, inDaysText, todayISO } from '../lib/dates'
import { collectDates, upcomingDates, type DatedItem } from '../lib/deadlines'
import { download } from '../lib/files'
import { buildIcs } from '../lib/ics'
import { useEvents, type EventRow } from '../state/hooks'
import {
  CERTAINTIES,
  EVENT_KINDS,
  EVENT_STATUSES,
  INTERNSHIP_TRACKS,
  type Certainty,
  type Dated,
  type EventEntry,
  type EventKind,
  type EventStatus,
  type Round,
} from '../types'

const STATUS_COLORS: Record<EventStatus, string> = {
  Interested: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Registered: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'In progress': 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  Finished: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Skipped: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
}

// "13 Oct 2026, 15:00–19:00 (Moscow)" or "27 Nov 2026 – 29 Nov 2026"
function whenText(d: Dated) {
  const days = d.start === d.end ? formatDate(d.end) : `${formatDate(d.start)} – ${formatDate(d.end)}`
  return d.startTime ? `${days}, ${d.startTime}–${d.endTime} (Moscow)` : days
}

// Download one date as its own calendar file
function IcsButton({ item }: { item: DatedItem }) {
  return (
    <button
      onClick={() => download(`${item.id}.ics`, buildIcs([item]), 'text/calendar')}
      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
      aria-label={`Add “${item.label}” to calendar`}
    >
      + calendar
    </button>
  )
}

export default function Events() {
  const { rows: events, add } = useEvents()
  const [showAdd, setShowAdd] = useState(false)
  const today = todayISO()
  const upcoming = upcomingDates(collectDates(events), today).filter((d) => d.kind === 'event')

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Championships & events</h1>
        <button onClick={() => setShowAdd(!showAdd)} className={buttonClass} aria-expanded={showAdd}>
          {showAdd ? 'Cancel' : '+ Add event'}
        </button>
      </div>

      {showAdd && (
        <AddEventForm
          onAdd={(e) => {
            add(e)
            setShowAdd(false)
          }}
        />
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium">Upcoming dates</h2>
          {upcoming.length === 0 && <p className="text-sm text-slate-500">No upcoming dates.</p>}
          <ul className="space-y-2">
            {upcoming.map((d) => (
              <li key={d.id} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{d.label}</span>
                  <CertaintyBadge value={d.certainty} />
                </div>
                <div className="flex flex-wrap gap-x-2 text-slate-500">
                  {whenText(d)} · {inDaysText(d.start > today ? d.start : d.end)}
                  <IcsButton item={d} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card tone="note" className="text-sm">
          <h2 className="mb-1 font-medium">How to get CV value from a case</h2>
          <ul className="list-disc space-y-0.5 pl-5">
            <li>Own one part end to end, ideally the financial model.</li>
            <li>After each round, write down what you personally did, with numbers. Use “Log a round” below.</li>
          </ul>
        </Card>
      </div>

      {events.length === 0 && <EmptyState>No events yet. Add one with “+ Add event”.</EmptyState>}

      {(Object.keys(EVENT_KINDS) as EventKind[]).map((kind) => {
        const list = events.filter((e) => e.kind === kind)
        if (list.length === 0) return null
        return (
          <section key={kind} className="space-y-3">
            <h2 className="pt-2 text-sm font-semibold tracking-wide text-slate-500 uppercase">
              {EVENT_KINDS[kind]}s ({list.length})
            </h2>
            {list.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </section>
        )
      })}
    </div>
  )
}

// ---------- one event ----------

function EventCard({ event: e }: { event: EventRow }) {
  const { update, remove, addRound, removeRound } = useEvents()
  const [logging, setLogging] = useState(false)
  const s = e.state

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{e.name}</h3>
          {e.info && <div className="text-sm text-slate-500">{e.info}</div>}
        </div>
        <div className="flex items-center gap-2">
          {e.track && <TrackTags tracks={[e.track]} />}
          {e.custom && (
            <button
              onClick={() => confirm(`Delete “${e.name}” and its round log?`) && remove(e.id)}
              className="text-xs text-rose-600 hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {(e.resources.length > 0 || e.link) && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
          {e.resources.map((id) => (
            <ResourceLink key={id} id={id} />
          ))}
          {e.link && <ExternalLink href={e.link}>Link</ExternalLink>}
        </div>
      )}

      {e.dates.length > 0 && (
        <ul className="space-y-1 text-sm">
          {e.dates.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-x-2">
              <span>{d.label}:</span>
              <span className="text-slate-500">{whenText(d)}</span>
              <CertaintyBadge value={d.certainty} />
              <IcsButton item={{ ...d, kind: 'event', eventId: e.id }} />
              {d.note && <span className="w-full text-xs text-slate-400">{d.note}</span>}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <select
          aria-label={`Status for ${e.name}`}
          value={s.status}
          onChange={(ev) => update(e.id, { status: ev.target.value as EventStatus })}
          className={`rounded-md border-0 px-2 py-1 text-sm font-medium ${STATUS_COLORS[s.status]}`}
        >
          {EVENT_STATUSES.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <textarea
          aria-label={`Notes for ${e.name}`}
          value={s.notes}
          onChange={(ev) => update(e.id, { notes: ev.target.value })}
          rows={1}
          placeholder="Notes: team, registration link, deadlines…"
          className={`${inputClass} flex-1`}
        />
      </div>

      {/* Round log */}
      <div className="space-y-2">
        {s.rounds.length > 0 && (
          <ul className="space-y-2 border-l-2 border-slate-200 pl-3 dark:border-slate-700">
            {s.rounds.map((r) => (
              <li key={r.id} className="text-sm">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="font-medium">{r.round || 'Round'}</span>
                  {r.date && <span className="text-xs text-slate-500">{formatDate(r.date)}</span>}
                  {r.result && <span className="text-xs text-emerald-700 dark:text-emerald-400">· {r.result}</span>}
                  <button
                    onClick={() => confirm('Delete this round?') && removeRound(e.id, r.id)}
                    className="ml-auto text-xs text-slate-400 hover:text-rose-600"
                    aria-label={`Delete round ${r.round}`}
                  >
                    ✕
                  </button>
                </div>
                {r.whatIDid && <p className="whitespace-pre-line text-slate-600 dark:text-slate-400">{r.whatIDid}</p>}
              </li>
            ))}
          </ul>
        )}
        {logging ? (
          <RoundForm
            onSave={(r) => {
              addRound(e.id, r)
              setLogging(false)
            }}
            onCancel={() => setLogging(false)}
          />
        ) : (
          <button onClick={() => setLogging(true)} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            + Log a round
          </button>
        )}
      </div>
    </Card>
  )
}

// ---------- forms ----------

function RoundForm({ onSave, onCancel }: { onSave: (r: Round) => void; onCancel: () => void }) {
  const [r, setR] = useState<Round>({ id: '', date: todayISO(), round: '', whatIDid: '', result: '' })
  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault()
        onSave({ ...r, id: crypto.randomUUID() })
      }}
      className="space-y-2 rounded-md bg-slate-50 p-3 dark:bg-slate-800/50"
    >
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          aria-label="Round date"
          value={r.date}
          onChange={(ev) => setR({ ...r, date: ev.target.value })}
          className={inputClass}
        />
        <input
          required
          aria-label="Round name"
          value={r.round}
          onChange={(ev) => setR({ ...r, round: ev.target.value })}
          placeholder="Round, e.g. Qualifying round"
          className={`${inputClass} flex-1`}
        />
        <input
          aria-label="Result"
          value={r.result}
          onChange={(ev) => setR({ ...r, result: ev.target.value })}
          placeholder="Result, e.g. top 20 of 150"
          className={`${inputClass} flex-1`}
        />
      </div>
      <textarea
        aria-label="What I personally did"
        value={r.whatIDid}
        onChange={(ev) => setR({ ...r, whatIDid: ev.target.value })}
        rows={3}
        placeholder="What I personally did, with numbers"
        className={`${inputClass} w-full`}
      />
      <div className="flex gap-2">
        <button type="submit" className={buttonClass}>
          Save round
        </button>
        <button type="button" onClick={onCancel} className={secondaryButtonClass}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function AddEventForm({ onAdd }: { onAdd: (e: EventEntry) => void }) {
  const [e, setE] = useState({ name: '', kind: 'case' as EventKind, track: '', info: '', link: '' })
  // Optional date, so the event also shows on the Dashboard, Timeline and in the calendar export
  const [date, setDate] = useState({ start: '', end: '', certainty: 'official' as Certainty, deadline: false })

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault()
        const id = crypto.randomUUID()
        const dates: Dated[] = date.start
          ? [
              {
                id: `${id}-date`,
                label: e.name,
                start: date.start,
                end: date.end && date.end >= date.start ? date.end : date.start,
                certainty: date.certainty,
                deadline: date.deadline,
                note: '',
              },
            ]
          : []
        onAdd({ ...e, id, resources: [], dates })
      }}
      className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900"
    >
      <label className="flex flex-col gap-1 text-sm">
        Name *
        <input
          required
          value={e.name}
          onChange={(ev) => setE({ ...e, name: ev.target.value })}
          className={inputClass}
        />
      </label>
      <div className="flex gap-3 text-sm">
        <label className="flex flex-1 flex-col gap-1">
          Kind
          <select
            value={e.kind}
            onChange={(ev) => setE({ ...e, kind: ev.target.value as EventKind })}
            className={inputClass}
          >
            {(Object.keys(EVENT_KINDS) as EventKind[]).map((k) => (
              <option key={k} value={k}>
                {EVENT_KINDS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Track
          <select value={e.track} onChange={(ev) => setE({ ...e, track: ev.target.value })} className={inputClass}>
            <option value="">None</option>
            {INTERNSHIP_TRACKS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Info
        <input
          value={e.info}
          onChange={(ev) => setE({ ...e, info: ev.target.value })}
          placeholder="Format, who organises it"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Link
        <input
          type="url"
          value={e.link}
          onChange={(ev) => setE({ ...e, link: ev.target.value })}
          placeholder="https://…"
          className={inputClass}
        />
      </label>
      <fieldset className="flex flex-wrap items-end gap-3 text-sm sm:col-span-2">
        <legend className="mb-1 text-slate-500">Date (optional)</legend>
        <label className="flex flex-col gap-1">
          From
          <input
            type="date"
            value={date.start}
            onChange={(ev) => setDate({ ...date, start: ev.target.value })}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          To (optional)
          <input
            type="date"
            value={date.end}
            onChange={(ev) => setDate({ ...date, end: ev.target.value })}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          Badge
          <select
            value={date.certainty}
            onChange={(ev) => setDate({ ...date, certainty: ev.target.value as Certainty })}
            className={inputClass}
          >
            {CERTAINTIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 pb-1">
          <input
            type="checkbox"
            checked={date.deadline}
            onChange={(ev) => setDate({ ...date, deadline: ev.target.checked })}
          />
          It's a deadline
        </label>
      </fieldset>
      <div className="sm:col-span-2">
        <button type="submit" className={buttonClass}>
          Save event
        </button>
      </div>
    </form>
  )
}
