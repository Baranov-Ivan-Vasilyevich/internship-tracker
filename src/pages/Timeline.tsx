// Gantt-style chart, Sep 2026 → Oct 2027, built with plain divs.
// Each bar is placed with CSS percentages: left = where it starts, width = how long it is.
import { CertaintyBadge } from '../components/ui'
import { MONTH_NAMES, addDays, formatDate, monthEnd, parseDate, todayISO } from '../lib/dates'
import { KEY_DATES, LEARNING } from '../seed'
import type { Certainty } from '../types'

const RANGE_START = parseDate('2026-09-01')
const RANGE_END = parseDate('2027-11-01') // first day AFTER the chart, so all of October is shown
const SPAN = RANGE_END.getTime() - RANGE_START.getTime()

// Date → position across the chart, 0–100 (%)
function pct(iso: string) {
  const p = ((parseDate(iso).getTime() - RANGE_START.getTime()) / SPAN) * 100
  return Math.min(100, Math.max(0, p))
}

type Kind = 'learning' | 'application' | 'internship' | 'competition'
const KIND_STYLE: Record<Kind, string> = {
  learning: 'bg-orange-200 border-orange-500 dark:bg-orange-900/60 dark:border-orange-400',
  application: 'bg-blue-200 border-blue-500 dark:bg-blue-900/60 dark:border-blue-400',
  internship: 'bg-emerald-200 border-emerald-500 dark:bg-emerald-900/60 dark:border-emerald-400',
  competition: 'bg-violet-200 border-violet-500 dark:bg-violet-900/60 dark:border-violet-400',
}
const LEGEND: [Kind, string][] = [
  ['learning', 'Learning'],
  ['application', 'Applications'],
  ['internship', 'Internship'],
  ['competition', 'Competitions'],
]

type Row = { id: string; label: string; start: string; end: string; kind: Kind; certainty?: Certainty }

// Learning: the 8 foundation steps. A month like "2026-11" ends on its last day.
const learningRows: Row[] = LEARNING.filter((i) => i.track === 'foundation' && i.start).map((i) => ({
  id: i.id,
  label: i.title.split(':')[0], // "Python basics: types, …" → "Python basics"
  start: `${i.start}-01`,
  end: monthEnd(i.end ?? i.start!),
  kind: 'learning',
}))

// Applications, internship and competitions from dates.json
const dateRows: Row[] = KEY_DATES.map((d) => ({
  id: d.id,
  label: d.label,
  start: d.start,
  end: d.end,
  kind: d.type,
  certainty: d.certainty,
})).sort((a, b) => a.start.localeCompare(b.start))

// Month labels along the top
const MONTHS = Array.from({ length: 14 }, (_, n) => {
  const d = new Date(2026, 8 + n, 1)
  return {
    iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`,
    label: MONTH_NAMES[d.getMonth()],
    year: d.getMonth() === 0 || n === 0 ? d.getFullYear() : null,
  }
})

// Left column width; the overlay (grid lines + today line) starts right after it
// sticky: labels stay in place while you scroll the chart sideways on a phone
const LABEL_COL = 'w-40 sm:w-64 sticky left-0 z-20 bg-white dark:bg-slate-900'
const OVERLAY_LEFT = 'left-40 sm:left-64'

export default function Timeline() {
  const today = todayISO()
  const todayPct = pct(today)
  const showToday = today >= '2026-09-01' && today < '2027-11-01'

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Timeline</h1>

      <div className="flex flex-wrap gap-4 text-xs">
        {LEGEND.map(([kind, label]) => (
          <span key={kind} className="flex items-center gap-1.5">
            <span className={`inline-block h-3 w-5 rounded-full border ${KIND_STYLE[kind]}`} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-0.5 bg-rose-500" /> Today
        </span>
        <span className="text-slate-500">Dashed border = expected or approximate date</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* min-width keeps bars readable on a phone: swipe sideways to see the rest */}
        <div className="relative min-w-[720px] pb-2">
          {/* Month grid lines + today line, drawn once over all rows */}
          <div className={`pointer-events-none absolute inset-y-0 right-4 ${OVERLAY_LEFT}`}>
            {MONTHS.map((m) => (
              <div
                key={m.iso}
                className="absolute inset-y-0 border-l border-slate-100 dark:border-slate-800"
                style={{ left: `${pct(m.iso)}%` }}
              />
            ))}
            {showToday && (
              <div className="absolute inset-y-0 z-10 w-0.5 bg-rose-500" style={{ left: `${todayPct}%` }}>
                <span className="absolute bottom-1 left-1 rounded bg-rose-500 px-1 text-[10px] text-white">today</span>
              </div>
            )}
          </div>

          {/* Month labels */}
          <div className="flex pr-4">
            <div className={`shrink-0 ${LABEL_COL}`} />
            <div className="relative h-11 flex-1 pt-2">
              {MONTHS.map((m) => (
                <div
                  key={m.iso}
                  className="absolute top-2 pl-1 text-xs text-slate-500"
                  style={{ left: `${pct(m.iso)}%` }}
                >
                  <div className="h-4 font-medium">{m.year}</div>
                  <div>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <Section title="Learning: foundation track" rows={learningRows} />
          <Section title="Applications, internship & competitions" rows={dateRows} />
        </div>
      </div>
    </div>
  )
}

function Section({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="mt-2">
      <div
        className={`${LABEL_COL} w-max! pr-2 pl-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-slate-500 uppercase`}
      >
        {title}
      </div>
      {rows.map((r) => (
        <div key={r.id} className="flex pr-4">
          <div className={`flex shrink-0 flex-col justify-center px-4 py-1 ${LABEL_COL}`}>
            <div className="truncate text-sm" title={r.label}>
              {r.label}
            </div>
            <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
              {/* "1 Oct – 30 Nov 2026": the year is shown once, on the end date */}
              {r.start !== r.end && `${formatDate(r.start).replace(/ \d{4}$/, '')} – `}
              {formatDate(r.end)}
              {r.certainty && <CertaintyBadge value={r.certainty} />}
            </div>
          </div>
          <div className="relative min-h-10 flex-1">
            <Bar row={r} />
          </div>
        </div>
      ))}
    </div>
  )
}

function Bar({ row }: { row: Row }) {
  const left = pct(row.start)
  const width = pct(addDays(row.end, 1)) - left // +1 day so the end date is included
  if (width <= 0) return null // completely outside the chart
  const dashed = row.certainty === 'expected' || row.certainty === 'approximate'
  return (
    <div
      className={`absolute top-1/2 h-4 min-w-2 -translate-y-1/2 rounded-full border ${dashed ? 'border-dashed' : ''} ${KIND_STYLE[row.kind]}`}
      style={{ left: `${left}%`, width: `${width}%` }}
      title={`${row.label}: ${formatDate(row.start)} – ${formatDate(row.end)}${row.certainty ? ` (${row.certainty})` : ''}`}
    />
  )
}
