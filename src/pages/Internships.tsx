import { useState } from 'react'
import { TrackTags } from '../components/ui'
import { useInternships } from '../store'
import { FITS, INTERNSHIP_TRACKS, STATUSES, type Fit, type Internship, type Status } from '../types'

// ---------- small building blocks ----------

const STATUS_COLORS: Record<Status, string> = {
  'Not started': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Preparing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Interview: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  Offer: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
}

const FIT_COLORS: Record<Fit, string> = {
  High: 'text-emerald-700 dark:text-emerald-400',
  Medium: 'text-amber-700 dark:text-amber-400',
  Low: 'text-slate-500 dark:text-slate-400',
}

const inputClass =
  'rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900'

function StatusSelect({ value, onChange }: { value: Status; onChange: (s: Status) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      className={`rounded-md border-0 px-2 py-1 text-sm font-medium ${STATUS_COLORS[value]}`}
    >
      {STATUSES.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  )
}

// ---------- sorting & filtering ----------

type SortKey = 'order' | 'company' | 'qualify' | 'ibFit' | 'mlFit' | 'status' | 'dateApplied'

const fitRank = (f: Fit) => FITS.indexOf(f) // High = 0, so High sorts first

function compare(a: Internship, b: Internship, key: SortKey): number {
  switch (key) {
    case 'company':
      return a.company.localeCompare(b.company)
    case 'qualify':
      return Number(b.qualifyNow) - Number(a.qualifyNow) // "now" first
    case 'ibFit':
      return fitRank(a.ibFit) - fitRank(b.ibFit)
    case 'mlFit':
      return fitRank(a.mlFit) - fitRank(b.mlFit)
    case 'status':
      return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status)
    case 'dateApplied':
      return (a.dateApplied || '9999').localeCompare(b.dateApplied || '9999') // empty last
    default:
      return 0 // "order" keeps the doc order (soonest to latest)
  }
}

type Filters = { track: string; qualify: string; ibFit: string; mlFit: string }
const NO_FILTERS: Filters = { track: 'all', qualify: 'all', ibFit: 'all', mlFit: 'all' }

function matches(i: Internship, f: Filters): boolean {
  if (f.track === 'other' && i.tracks.length > 0) return false
  if (f.track !== 'all' && f.track !== 'other' && !i.tracks.includes(f.track)) return false
  if (f.qualify === 'now' && !i.qualifyNow) return false
  if (f.qualify === 'later' && i.qualifyNow) return false
  if (f.ibFit !== 'all' && i.ibFit !== f.ibFit) return false
  if (f.mlFit !== 'all' && i.mlFit !== f.mlFit) return false
  return true
}

// A clickable column header. Shows ▲/▼ on the column you sorted by.
function SortHeader(props: { k: SortKey; sort: { key: SortKey; asc: boolean }; onSort: (k: SortKey) => void; children: string }) {
  const { k, sort, onSort, children } = props
  return (
    <th className="px-2 py-2 text-left font-medium">
      <button onClick={() => onSort(k)} className="hover:underline">
        {children}
        {sort.key === k ? (sort.asc ? ' ▲' : ' ▼') : ''}
      </button>
    </th>
  )
}

// ---------- the page ----------

export default function Internships() {
  const { internships, update, add } = useInternships()
  const [filters, setFilters] = useState<Filters>(NO_FILTERS)
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'order', asc: true })
  const [showAdd, setShowAdd] = useState(false)

  const setFilter = (k: keyof Filters, v: string) => setFilters({ ...filters, [k]: v })

  // Click a header once to sort, again to reverse
  const sortBy = (key: SortKey) =>
    setSort(sort.key === key ? { key, asc: !sort.asc } : { key, asc: true })

  const rows = internships
    .filter((i) => matches(i, filters))
    .sort((a, b) => compare(a, b, sort.key) * (sort.asc ? 1 : -1))


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Internships</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white dark:bg-slate-100 dark:text-slate-900"
        >
          {showAdd ? 'Cancel' : '+ Add internship'}
        </button>
      </div>

      {showAdd && (
        <AddForm
          onAdd={(i) => {
            add(i)
            setShowAdd(false)
          }}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 text-sm">
        <select value={filters.track} onChange={(e) => setFilter('track', e.target.value)} className={inputClass}>
          <option value="all">All tracks</option>
          {INTERNSHIP_TRACKS.map((t) => (
            <option key={t} value={t}>
              Track {t}
            </option>
          ))}
          <option value="other">Other</option>
        </select>
        <select value={filters.qualify} onChange={(e) => setFilter('qualify', e.target.value)} className={inputClass}>
          <option value="all">Qualify: any time</option>
          <option value="now">Qualify now</option>
          <option value="later">Qualify later</option>
        </select>
        <select value={filters.ibFit} onChange={(e) => setFilter('ibFit', e.target.value)} className={inputClass}>
          <option value="all">IB fit: any</option>
          {FITS.map((f) => (
            <option key={f} value={f}>
              IB fit: {f}
            </option>
          ))}
        </select>
        <select value={filters.mlFit} onChange={(e) => setFilter('mlFit', e.target.value)} className={inputClass}>
          <option value="all">ML fit: any</option>
          {FITS.map((f) => (
            <option key={f} value={f}>
              ML fit: {f}
            </option>
          ))}
        </select>
        {/* On phones there are no column headers, so offer sorting here too */}
        <select
          value={sort.key}
          onChange={(e) => setSort({ key: e.target.value as SortKey, asc: true })}
          className={`${inputClass} md:hidden`}
        >
          <option value="order">Sort: doc order</option>
          <option value="company">Sort: company</option>
          <option value="qualify">Sort: qualify now first</option>
          <option value="ibFit">Sort: IB fit</option>
          <option value="mlFit">Sort: ML fit</option>
          <option value="status">Sort: status</option>
          <option value="dateApplied">Sort: date applied</option>
        </select>
        {JSON.stringify(filters) !== JSON.stringify(NO_FILTERS) && (
          <button onClick={() => setFilters(NO_FILTERS)} className="px-2 text-slate-500 underline">
            Clear
          </button>
        )}
        <span className="self-center text-slate-500">
          {rows.length} of {internships.length}
        </span>
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block dark:border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 dark:bg-slate-900">
            <tr>
              <SortHeader sort={sort} onSort={sortBy} k="company">Program</SortHeader>
              <th className="px-2 py-2 text-left font-medium">Track</th>
              <SortHeader sort={sort} onSort={sortBy} k="qualify">You qualify</SortHeader>
              <th className="px-2 py-2 text-left font-medium">Hours · Applications</th>
              <SortHeader sort={sort} onSort={sortBy} k="ibFit">IB</SortHeader>
              <SortHeader sort={sort} onSort={sortBy} k="mlFit">ML</SortHeader>
              <SortHeader sort={sort} onSort={sortBy} k="status">Status</SortHeader>
              <SortHeader sort={sort} onSort={sortBy} k="dateApplied">Applied on</SortHeader>
              <th className="px-2 py-2 text-left font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i.id} className="border-t border-slate-200 align-top dark:border-slate-800">
                <td className="px-2 py-2">
                  <ProgramName i={i} />
                </td>
                <td className="px-2 py-2">
                  <TrackTags tracks={i.tracks} />
                </td>
                <td className="px-2 py-2">
                  <QualifyText i={i} />
                </td>
                <td className="px-2 py-2 text-slate-600 dark:text-slate-400">
                  {hoursText(i.hours)}
                  <div>{i.applicationWindow}</div>
                </td>
                <td className={`px-2 py-2 ${FIT_COLORS[i.ibFit]}`}>{i.ibFit}</td>
                <td className={`px-2 py-2 ${FIT_COLORS[i.mlFit]}`}>{i.mlFit}</td>
                <td className="px-2 py-2">
                  <StatusSelect value={i.status} onChange={(status) => update(i.id, { status })} />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="date"
                    value={i.dateApplied}
                    onChange={(e) => update(i.id, { dateApplied: e.target.value })}
                    className={inputClass}
                  />
                </td>
                <td className="px-2 py-2">
                  <textarea
                    value={i.notes}
                    onChange={(e) => update(i.id, { notes: e.target.value })}
                    rows={1}
                    placeholder="Notes…"
                    className={`${inputClass} w-44`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone: one card per internship */}
      <div className="space-y-3 md:hidden">
        {rows.map((i) => (
          <div key={i.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-2">
              <ProgramName i={i} />
              <TrackTags tracks={i.tracks} />
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <QualifyText i={i} /> · {hoursText(i.hours)}
              <div>Applications: {i.applicationWindow}</div>
              <div>
                Fit: IB <span className={FIT_COLORS[i.ibFit]}>{i.ibFit}</span> · ML{' '}
                <span className={FIT_COLORS[i.mlFit]}>{i.mlFit}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusSelect value={i.status} onChange={(status) => update(i.id, { status })} />
              <label className="flex items-center gap-1 text-xs text-slate-500">
                Applied
                <input
                  type="date"
                  value={i.dateApplied}
                  onChange={(e) => update(i.id, { dateApplied: e.target.value })}
                  className={inputClass}
                />
              </label>
            </div>
            <textarea
              value={i.notes}
              onChange={(e) => update(i.id, { notes: e.target.value })}
              rows={2}
              placeholder="Notes…"
              className={`${inputClass} w-full`}
            />
          </div>
        ))}
      </div>

      {rows.length === 0 && <p className="text-slate-500">No internships match these filters.</p>}
    </div>
  )
}

function ProgramName({ i }: { i: Internship }) {
  return (
    <div>
      <a href={i.link} target="_blank" rel="noreferrer" className="font-medium hover:underline">
        {i.company}
        {i.role && `: ${i.role}`}
      </a>
      <div className="text-xs text-slate-500">{i.whatYouDo}</div>
    </div>
  )
}

// "20–40" → "20–40 h/week", but "Part-time" or "Mon–Thu 11:00–15:30" stay as they are
function hoursText(hours: string) {
  return /^(Up to )?\d[\d–+]*$/.test(hours) ? `${hours} h/week` : hours
}

function QualifyText({ i }: { i: Internship }) {
  return (
    <span className={i.qualifyNow ? 'font-medium text-emerald-700 dark:text-emerald-400' : ''}>{i.qualify}</span>
  )
}

// ---------- "Add internship" form ----------

function AddForm({ onAdd }: { onAdd: (i: Internship) => void }) {
  const [form, setForm] = useState<Internship>({
    id: '',
    company: '',
    role: '',
    whatYouDo: '',
    qualify: '',
    qualifyNow: false,
    hours: '',
    applicationWindow: '',
    ibFit: 'Medium',
    mlFit: 'Medium',
    link: '',
    tracks: [],
    status: 'Not started',
    notes: '',
    dateApplied: '',
  })
  const set = (changes: Partial<Internship>) => setForm({ ...form, ...changes })

  const text = (key: keyof Internship, label: string, placeholder = '') => (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        value={form[key] as string}
        onChange={(e) => set({ [key]: e.target.value })}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onAdd({ ...form, id: crypto.randomUUID() })
      }}
      className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900"
    >
      <label className="flex flex-col gap-1 text-sm">
        Company *
        <input required value={form.company} onChange={(e) => set({ company: e.target.value })} className={inputClass} />
      </label>
      {text('role', 'Role')}
      {text('whatYouDo', 'What you do')}
      {text('qualify', 'When I qualify', 'e.g. Autumn 2027 (3rd year)')}
      {text('hours', 'Hours/week')}
      {text('applicationWindow', 'Application window', 'e.g. Mar–Apr 2027')}
      {text('link', 'Link', 'https://…')}
      <div className="flex gap-3 text-sm">
        <label className="flex flex-col gap-1">
          IB fit
          <select value={form.ibFit} onChange={(e) => set({ ibFit: e.target.value as Fit })} className={inputClass}>
            {FITS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          ML fit
          <select value={form.mlFit} onChange={(e) => set({ mlFit: e.target.value as Fit })} className={inputClass}>
            {FITS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={form.qualifyNow} onChange={(e) => set({ qualifyNow: e.target.checked })} />
          I qualify now
        </label>
        <span className="text-slate-500">Tracks:</span>
        {INTERNSHIP_TRACKS.map((t) => (
          <label key={t} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={form.tracks.includes(t)}
              onChange={(e) =>
                set({ tracks: e.target.checked ? [...form.tracks, t] : form.tracks.filter((x) => x !== t) })
              }
            />
            {t}
          </label>
        ))}
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white dark:bg-slate-100 dark:text-slate-900">
          Save internship
        </button>
      </div>
    </form>
  )
}
