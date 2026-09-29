import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { EmptyState, TrackTags, buttonClass, inputClass } from '../components/ui'
import { currentMonth, formatDate } from '../lib/dates'
import { eligibilityText, isEligibleNow } from '../lib/eligibility'
import { useInternships, type InternshipRow } from '../state/hooks'
import { FITS, INTERNSHIP_TRACKS, STATUSES, type Fit, type Internship } from '../types'
import InternshipDetail from './InternshipDetail'
import { StatusSelect } from '../components/StatusSelect'

const FIT_COLORS: Record<Fit, string> = {
  High: 'text-emerald-700 dark:text-emerald-400',
  Medium: 'text-amber-700 dark:text-amber-400',
  Low: 'text-slate-500 dark:text-slate-400',
}

// "20–40" → "20–40 h/week", but "Part-time" or "Mon–Thu 11:00–15:30" stay as they are
function hoursText(hours: string) {
  return /^(Up to )?\d[\d–+]*$/.test(hours) ? `${hours} h/week` : hours
}

// ---------- sorting & filtering ----------

type SortKey = 'order' | 'company' | 'eligible' | 'ibFit' | 'mlFit' | 'status' | 'nextAction'

const fitRank = (f: Fit) => FITS.indexOf(f) // High = 0, so High sorts first

function compare(a: InternshipRow, b: InternshipRow, key: SortKey): number {
  switch (key) {
    case 'company':
      return a.company.localeCompare(b.company)
    case 'eligible':
      return (a.eligibleFrom ?? '9999').localeCompare(b.eligibleFrom ?? '9999') // unknown last
    case 'ibFit':
      return fitRank(a.ibFit) - fitRank(b.ibFit)
    case 'mlFit':
      return fitRank(a.mlFit) - fitRank(b.mlFit)
    case 'status':
      return STATUSES.indexOf(a.state.status) - STATUSES.indexOf(b.state.status)
    case 'nextAction':
      return (a.state.nextAction.due || '9999').localeCompare(b.state.nextAction.due || '9999')
    default:
      return 0 // "order" keeps the doc order (soonest to latest)
  }
}

type Filters = { search: string; track: string; eligible: string; ibFit: string; mlFit: string; status: string }
const NO_FILTERS: Filters = { search: '', track: 'all', eligible: 'all', ibFit: 'all', mlFit: 'all', status: 'all' }

function matches(i: InternshipRow, f: Filters, month: string): boolean {
  const q = f.search.trim().toLowerCase()
  if (q && !`${i.company} ${i.role} ${i.whatYouDo} ${i.state.notes}`.toLowerCase().includes(q)) return false
  if (f.track === 'other' && i.tracks.length > 0) return false
  if (f.track !== 'all' && f.track !== 'other' && !i.tracks.includes(f.track)) return false
  if (f.eligible === 'now' && !isEligibleNow(i.eligibleFrom, month)) return false
  if (f.eligible === 'later' && isEligibleNow(i.eligibleFrom, month)) return false
  if (f.ibFit !== 'all' && i.ibFit !== f.ibFit) return false
  if (f.mlFit !== 'all' && i.mlFit !== f.mlFit) return false
  if (f.status !== 'all' && i.state.status !== f.status) return false
  return true
}

// A clickable column header. Shows ▲/▼ on the column you sorted by.
function SortHeader(props: {
  k: SortKey
  sort: { key: SortKey; asc: boolean }
  onSort: (k: SortKey) => void
  children: string
}) {
  const { k, sort, onSort, children } = props
  const active = sort.key === k
  return (
    <th
      className="px-2 py-2 text-left font-medium"
      aria-sort={active ? (sort.asc ? 'ascending' : 'descending') : 'none'}
    >
      <button onClick={() => onSort(k)} className="hover:underline">
        {children}
        {active ? (sort.asc ? ' ▲' : ' ▼') : ''}
      </button>
    </th>
  )
}

// ---------- the page ----------

export default function Internships() {
  const { rows: all, update, add } = useInternships()
  const { id: openId } = useParams()
  const navigate = useNavigate()
  // The Dashboard links here with ?status=Applied etc. to open the list already filtered
  const [params] = useSearchParams()
  const [filters, setFilters] = useState<Filters>({ ...NO_FILTERS, status: params.get('status') ?? 'all' })
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: 'order', asc: true })
  const [showAdd, setShowAdd] = useState(false)
  const month = currentMonth()

  const setFilter = (k: keyof Filters, v: string) => setFilters({ ...filters, [k]: v })
  const sortBy = (key: SortKey) => setSort(sort.key === key ? { key, asc: !sort.asc } : { key, asc: true })

  const rows = all
    .filter((i) => matches(i, filters, month))
    .sort((a, b) => compare(a, b, sort.key) * (sort.asc ? 1 : -1))
  const open = all.find((i) => i.id === openId)

  const filterSelect = (k: keyof Filters, label: string, options: [string, string][]) => (
    <select aria-label={label} value={filters[k]} onChange={(e) => setFilter(k, e.target.value)} className={inputClass}>
      {options.map(([value, text]) => (
        <option key={value} value={value}>
          {text}
        </option>
      ))}
    </select>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Internships</h1>
        <button onClick={() => setShowAdd(!showAdd)} className={buttonClass} aria-expanded={showAdd}>
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
        <input
          type="search"
          aria-label="Search internships"
          placeholder="Search…"
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className={`${inputClass} w-full sm:w-44`}
        />
        {filterSelect('track', 'Track', [
          ['all', 'All tracks'],
          ...INTERNSHIP_TRACKS.map((t): [string, string] => [t, `Track ${t}`]),
          ['other', 'Other'],
        ])}
        {filterSelect('eligible', 'Eligibility', [
          ['all', 'Eligible: any time'],
          ['now', 'Eligible now'],
          ['later', 'Eligible later'],
        ])}
        {filterSelect('status', 'Status', [['all', 'Any status'], ...STATUSES.map((s): [string, string] => [s, s])])}
        {filterSelect('ibFit', 'IB fit', [
          ['all', 'IB fit: any'],
          ...FITS.map((f): [string, string] => [f, `IB fit: ${f}`]),
        ])}
        {filterSelect('mlFit', 'ML fit', [
          ['all', 'ML fit: any'],
          ...FITS.map((f): [string, string] => [f, `ML fit: ${f}`]),
        ])}
        {/* On phones there are no column headers, so offer sorting here too */}
        <select
          aria-label="Sort by"
          value={sort.key}
          onChange={(e) => setSort({ key: e.target.value as SortKey, asc: true })}
          className={`${inputClass} md:hidden`}
        >
          <option value="order">Sort: doc order</option>
          <option value="company">Sort: company</option>
          <option value="eligible">Sort: eligible soonest</option>
          <option value="ibFit">Sort: IB fit</option>
          <option value="mlFit">Sort: ML fit</option>
          <option value="status">Sort: status</option>
          <option value="nextAction">Sort: next action due</option>
        </select>
        {JSON.stringify(filters) !== JSON.stringify(NO_FILTERS) && (
          <button onClick={() => setFilters(NO_FILTERS)} className="px-2 text-slate-500 underline">
            Clear
          </button>
        )}
        <span className="self-center text-slate-500" aria-live="polite">
          {rows.length} of {all.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState>No internships match these filters.</EmptyState>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block dark:border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-900">
                <tr>
                  <SortHeader sort={sort} onSort={sortBy} k="company">
                    Program
                  </SortHeader>
                  <th className="px-2 py-2 text-left font-medium">Track</th>
                  <SortHeader sort={sort} onSort={sortBy} k="eligible">
                    Eligibility
                  </SortHeader>
                  <th className="px-2 py-2 text-left font-medium">Hours · Applications</th>
                  <SortHeader sort={sort} onSort={sortBy} k="ibFit">
                    IB
                  </SortHeader>
                  <SortHeader sort={sort} onSort={sortBy} k="mlFit">
                    ML
                  </SortHeader>
                  <SortHeader sort={sort} onSort={sortBy} k="status">
                    Status
                  </SortHeader>
                  <SortHeader sort={sort} onSort={sortBy} k="nextAction">
                    Next action
                  </SortHeader>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr key={i.id} className="border-t border-slate-200 align-top dark:border-slate-800">
                    <td className="max-w-56 px-2 py-2">
                      <ProgramName i={i} />
                    </td>
                    <td className="px-2 py-2">
                      <TrackTags tracks={i.tracks} />
                    </td>
                    <td className="px-2 py-2">
                      <Eligibility i={i} month={month} />
                    </td>
                    <td className="px-2 py-2 text-slate-600 dark:text-slate-400">
                      {hoursText(i.hours)}
                      <div>{i.applicationWindow}</div>
                    </td>
                    <td className={`px-2 py-2 ${FIT_COLORS[i.ibFit]}`}>{i.ibFit}</td>
                    <td className={`px-2 py-2 ${FIT_COLORS[i.mlFit]}`}>{i.mlFit}</td>
                    <td className="px-2 py-2">
                      <StatusSelect
                        label={`Status for ${i.company} ${i.role}`}
                        value={i.state.status}
                        onChange={(status) => update(i.id, { status })}
                      />
                    </td>
                    <td className="max-w-48 px-2 py-2">
                      <NextAction i={i} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone: one card per internship */}
          <div className="space-y-3 md:hidden">
            {rows.map((i) => (
              <div
                key={i.id}
                className="space-y-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <ProgramName i={i} />
                  <TrackTags tracks={i.tracks} />
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <Eligibility i={i} month={month} /> · {hoursText(i.hours)}
                  <div>Applications: {i.applicationWindow}</div>
                  <div>
                    Fit: IB <span className={FIT_COLORS[i.ibFit]}>{i.ibFit}</span> · ML{' '}
                    <span className={FIT_COLORS[i.mlFit]}>{i.mlFit}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusSelect
                    label={`Status for ${i.company} ${i.role}`}
                    value={i.state.status}
                    onChange={(status) => update(i.id, { status })}
                  />
                  <NextAction i={i} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {open && <InternshipDetail row={open} onClose={() => navigate('/internships')} />}
      {openId && !open && <EmptyState>Internship “{openId}” not found.</EmptyState>}
    </div>
  )
}

// The name opens the detail panel (notes, stages, log, sources…)
function ProgramName({ i }: { i: InternshipRow }) {
  return (
    <div>
      <Link to={`/internships/${i.id}`} className="font-medium hover:underline">
        {i.company}
        {i.role && `: ${i.role}`}
      </Link>
      <div className="text-xs text-slate-500">{i.whatYouDo}</div>
    </div>
  )
}

function Eligibility({ i, month }: { i: InternshipRow; month: string }) {
  const now = isEligibleNow(i.eligibleFrom, month)
  return (
    <span className={now ? 'font-medium text-emerald-700 dark:text-emerald-400' : ''} title={i.qualify}>
      {eligibilityText(i.eligibleFrom, month)}
      {i.eligibilityNote && <span className="block text-xs font-normal text-slate-500">{i.eligibilityNote}</span>}
    </span>
  )
}

function NextAction({ i }: { i: InternshipRow }) {
  const { text, due } = i.state.nextAction
  if (!text) return <span className="text-xs text-slate-400">—</span>
  return (
    <span className="text-xs">
      {text}
      {due && <span className="block text-slate-500">due {formatDate(due)}</span>}
    </span>
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
    eligibleFrom: null,
    hours: '',
    applicationWindow: '',
    ibFit: 'Medium',
    mlFit: 'Medium',
    link: '',
    tracks: [],
    stages: [],
    sources: [],
  })
  const set = (changes: Partial<Internship>) => setForm({ ...form, ...changes })

  type TextKey = 'role' | 'whatYouDo' | 'qualify' | 'hours' | 'applicationWindow' | 'link'
  const text = (key: TextKey, label: string, placeholder = '') => (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        value={form[key]}
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
        <input
          required
          value={form.company}
          onChange={(e) => set({ company: e.target.value })}
          className={inputClass}
        />
      </label>
      {text('role', 'Role')}
      {text('whatYouDo', 'What you do')}
      {text('qualify', 'Who can apply (text)', 'e.g. 3rd year and above')}
      <label className="flex flex-col gap-1 text-sm">
        Eligible from (month)
        <input
          type="month"
          value={form.eligibleFrom ?? ''}
          onChange={(e) => set({ eligibleFrom: e.target.value || null })}
          className={inputClass}
        />
      </label>
      {text('hours', 'Hours/week')}
      {text('applicationWindow', 'Application window', 'e.g. Mar–Apr 2027')}
      {text('link', 'Link', 'https://…')}
      <div className="flex gap-3 text-sm">
        {(['ibFit', 'mlFit'] as const).map((k) => (
          <label key={k} className="flex flex-col gap-1">
            {k === 'ibFit' ? 'IB fit' : 'ML fit'}
            <select value={form[k]} onChange={(e) => set({ [k]: e.target.value as Fit })} className={inputClass}>
              {FITS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <fieldset className="flex flex-wrap items-center gap-3 text-sm">
        <legend className="mb-1 text-slate-500">Tracks</legend>
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
      </fieldset>
      <div className="sm:col-span-2">
        <button type="submit" className={buttonClass}>
          Save internship
        </button>
      </div>
    </form>
  )
}
