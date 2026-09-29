import { Link } from 'react-router-dom'
import { ResourceLink } from '../components/ResourceLink'
import { Card, CertaintyBadge, ProgressBar } from '../components/ui'
import { currentMonth, formatDate, formatMonth, inDaysText, todayISO } from '../lib/dates'
import { collectDates, upcomingDeadlines } from '../lib/deadlines'
import { LEARNING, PROJECTS, isActive, trackLabel } from '../seed'
import { useData } from '../state/context'
import { useEvents, useInternships } from '../state/hooks'
import { STATUSES } from '../types'

export default function Dashboard() {
  const { data } = useData()
  const { rows: internships } = useInternships()
  const { rows: events } = useEvents()
  const today = todayISO()
  const month = currentMonth()
  const done = new Set(data.learningDone)

  // Next 3 deadlines: application windows and event dates that haven't passed yet
  const deadlines = upcomingDeadlines(collectDates(events), today).slice(0, 3)

  // Current phase of the foundation track, or the next one if we're between phases
  const foundation = LEARNING.filter((i) => i.track === 'foundation')
  const phase = foundation.find((i) => isActive(i, month))
  const nextPhase = foundation.find((i) => i.start && i.start > month)

  // Other items planned for this month that aren't ticked yet
  const thisMonth = LEARNING.filter((i) => i.track !== 'foundation' && isActive(i, month) && !done.has(i.id))

  const learningDone = LEARNING.filter((i) => done.has(i.id)).length
  const projectsDone = PROJECTS.filter((p) => data.projectsDone.includes(p.id)).length

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-medium">Next deadlines</h2>
          {deadlines.length === 0 && <p className="text-sm text-slate-500">No upcoming deadlines.</p>}
          <ul className="space-y-3">
            {deadlines.map((d) => (
              <li key={d.id} className="text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{d.label}</span>
                  <CertaintyBadge value={d.certainty} />
                </div>
                <div className="text-slate-500">
                  {formatDate(d.end)} ·{' '}
                  <span className="font-medium text-slate-700 dark:text-slate-300">{inDaysText(d.end)}</span>
                  {d.start > today && d.start !== d.end && ` · opens ${formatDate(d.start)}`}
                </div>
                {d.note && <div className="text-xs text-slate-400">{d.note}</div>}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-3 font-medium">Learning now</h2>
          {phase ? (
            <div className="text-sm">
              <div className="font-medium">{phase.title}</div>
              <div className="text-slate-500">Foundation · {phase.when}</div>
            </div>
          ) : nextPhase ? (
            <div className="text-sm">
              <div className="text-slate-500">Next phase, starting {formatMonth(nextPhase.start!)}:</div>
              <div className="font-medium">{nextPhase.title}</div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Foundation track finished.</p>
          )}
          {thisMonth.length > 0 && (
            <div className="mt-3 text-sm">
              <div className="mb-1 text-slate-500">Also planned this month:</div>
              <ul className="space-y-1">
                {thisMonth.slice(0, 5).map((i) => (
                  <li key={i.id}>
                    <span className="text-xs text-slate-400">{trackLabel(i.track)} · </span>
                    {i.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <Link to="/learning" className="mt-3 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400">
            Open learning →
          </Link>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 font-medium">Internships by status</h2>
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {STATUSES.map((s) => (
            <Link
              key={s}
              to={`/internships?status=${encodeURIComponent(s)}`}
              className="rounded-md bg-slate-50 p-3 text-center hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800"
            >
              <div className="text-2xl font-semibold tabular-nums">
                {internships.filter((i) => i.state.status === s).length}
              </div>
              <div className="text-xs text-slate-500">{s}</div>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="space-y-1">
        <h2 className="font-medium">Career feed</h2>
        <p className="text-sm text-slate-500">New internships and events are posted here first.</p>
        <ResourceLink id="fincareer-feed" />
      </Card>

      <Card className="space-y-3">
        <h2 className="font-medium">Progress</h2>
        <div>
          <div className="mb-1 text-sm">Learning: all tracks</div>
          <ProgressBar done={learningDone} total={LEARNING.length} />
        </div>
        <div>
          <div className="mb-1 text-sm">Own CV projects</div>
          <ProgressBar done={projectsDone} total={PROJECTS.length} />
        </div>
      </Card>
    </div>
  )
}
