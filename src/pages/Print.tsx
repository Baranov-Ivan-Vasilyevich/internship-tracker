// A plain, printer-friendly version of the whole plan. Open it and press "Print" (or Cmd+P).
// Print styles live in index.css (@media print): no menus, black text on white.
import { buttonClass } from '../components/ui'
import { currentMonth, formatDate, todayISO } from '../lib/dates'
import { collectDates, upcomingDates } from '../lib/deadlines'
import { eligibilityText } from '../lib/eligibility'
import { hoursByItem } from '../lib/timeLog'
import { LEARNING, PROJECTS, TRACKS } from '../seed'
import { useData } from '../state/context'
import { useEvents, useInternships, useProjects } from '../state/hooks'

const th = 'border-b border-slate-400 px-1 py-1 text-left font-semibold'
const td = 'border-b border-slate-200 px-1 py-1 align-top'

export default function Print() {
  const { data } = useData()
  const { rows: internships } = useInternships()
  const { rows: events } = useEvents()
  const { stateOf } = useProjects()
  const today = todayISO()
  const month = currentMonth()
  const dates = upcomingDates(collectDates(events), today)
  const hours = hoursByItem(data.timeLog)

  return (
    <div className="print-page space-y-6 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Internship & learning plan</h1>
        <button onClick={() => window.print()} className={`${buttonClass} no-print`}>
          Print
        </button>
      </div>
      <p className="text-slate-500">Printed {formatDate(today)}</p>

      <section className="break-inside-avoid">
        <h2 className="mb-2 text-base font-semibold">Upcoming dates</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>When</th>
              <th className={th}>What</th>
              <th className={th}>Badge</th>
            </tr>
          </thead>
          <tbody>
            {dates.map((d) => (
              <tr key={d.id}>
                <td className={`${td} whitespace-nowrap`}>
                  {d.start === d.end ? formatDate(d.end) : `${formatDate(d.start)} – ${formatDate(d.end)}`}
                </td>
                <td className={td}>
                  {d.deadline && 'Deadline: '}
                  {d.label}
                </td>
                <td className={td}>{d.certainty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">Internships</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Program</th>
              <th className={th}>Eligibility</th>
              <th className={th}>Status</th>
              <th className={th}>Next action</th>
            </tr>
          </thead>
          <tbody>
            {internships.map((i) => (
              <tr key={i.id} className="break-inside-avoid">
                <td className={td}>
                  {i.company}
                  {i.role && `: ${i.role}`}
                </td>
                <td className={td}>{eligibilityText(i.eligibleFrom, month)}</td>
                <td className={td}>{i.state.status}</td>
                <td className={td}>
                  {i.nextAction.text}
                  {i.nextAction.due && ` (due ${formatDate(i.nextAction.due)})`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold">Learning</h2>
        {TRACKS.map((t) => {
          const items = LEARNING.filter((i) => i.track === t.id)
          return (
            <div key={t.id} className="mb-3 break-inside-avoid">
              <h3 className="font-semibold">{t.name}</h3>
              <ul>
                {items.map((i) => (
                  <li key={i.id} className="flex gap-2">
                    <span aria-hidden>{data.learningDone.includes(i.id) ? '☑' : '☐'}</span>
                    <span className="w-28 shrink-0 text-slate-500">{i.when}</span>
                    <span className="flex-1">
                      {i.title}
                      {hours.get(i.id) ? ` · ${hours.get(i.id)} h` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </section>

      <section className="break-inside-avoid">
        <h2 className="mb-2 text-base font-semibold">Own CV projects</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Project</th>
              <th className={th}>Target</th>
              <th className={th}>Status</th>
              <th className={th}>Own work</th>
            </tr>
          </thead>
          <tbody>
            {PROJECTS.map((p) => {
              const s = stateOf(p.id)
              return (
                <tr key={p.id}>
                  <td className={td}>
                    {p.id} · {p.title}
                  </td>
                  <td className={td}>{p.when}</td>
                  <td className={td}>{s.status}</td>
                  <td className={td}>{s.selfWritten ? 'Yes' : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
