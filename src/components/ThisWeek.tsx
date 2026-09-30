// "This week" on the Dashboard: hours vs target, streak, what's due, deadlines, next actions.
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { addDays, currentMonth, formatDate, inDaysText, todayISO } from '../lib/dates'
import { collectDates, upcomingDeadlines } from '../lib/deadlines'
import { hoursInWeek, streak, weekStart } from '../lib/timeLog'
import { LEARNING, isActive, trackLabel } from '../seed'
import { useData } from '../state/context'
import { useEvents, useInternships, useTimeLog, useToggle } from '../state/hooks'
import { TimeLogForm } from './TimeLogForm'
import { Card, CertaintyBadge, ProgressBar } from './ui'

const DAYS_AHEAD = 14

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <h3 className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</h3>
      {children}
    </div>
  )
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-slate-400">{children}</p>

export function ThisWeek() {
  const { data } = useData()
  const toggle = useToggle()
  const { entries, target, add } = useTimeLog()
  const { rows: internships } = useInternships()
  const { rows: events } = useEvents()
  const today = todayISO()
  const month = currentMonth()
  const horizon = addDays(today, DAYS_AHEAD)

  const hours = hoursInWeek(entries, today)
  const { current, best } = streak(entries, target, today)

  // Learning items planned for this month that aren't ticked yet
  const due = LEARNING.filter((i) => isActive(i, month) && !data.learningDone.includes(i.id))
  const deadlines = upcomingDeadlines(collectDates(events), today).filter((d) => d.end <= horizon)
  const withAction = internships.filter((i) => i.nextAction.text)
  const actions = withAction
    .filter((i) => !i.nextAction.due || i.nextAction.due <= horizon)
    .sort((a, b) => (a.nextAction.due || '9999').localeCompare(b.nextAction.due || '9999'))
  const laterActions = withAction.length - actions.length

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-medium">This week</h2>
        <span className="text-xs text-slate-500">
          {formatDate(weekStart(today))} – {formatDate(addDays(weekStart(today), 6))}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Block title="Study time">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl font-semibold tabular-nums">{hours}</span>
            <span className="text-sm text-slate-500">of {target} h</span>
            <span className="ml-auto text-sm" title={`Best: ${best} weeks`}>
              Streak: <b>{current}</b> {current === 1 ? 'week' : 'weeks'}
              {best > current && <span className="text-slate-400"> · best {best}</span>}
            </span>
          </div>
          <ProgressBar done={Math.min(hours, target)} total={target} />
          <p className="text-xs text-slate-400">A week counts toward the streak once you log {target} h.</p>
          <div className="pt-2">
            <TimeLogForm
              onSave={add}
              items={due.map((i) => ({ id: i.id, label: `${trackLabel(i.track)}: ${i.title}` }))}
            />
          </div>
        </Block>

        <div className="min-w-0 space-y-4">
          <Block title="Learning due this month">
            {due.length === 0 && <Empty>Nothing due. Nice.</Empty>}
            <ul className="space-y-1">
              {due.slice(0, 6).map((i) => (
                <li key={i.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    id={`week-${i.id}`}
                    checked={false}
                    onChange={() => toggle('learningDone', i.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                  />
                  <label htmlFor={`week-${i.id}`} className="min-w-0 break-words">
                    <span className="text-xs text-slate-400">{trackLabel(i.track)} · </span>
                    {i.title}
                    {i.end === month && (
                      <span className="ml-1 text-xs text-amber-700 dark:text-amber-400">ends this month</span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
            {due.length > 6 && (
              <Link to="/learning" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                + {due.length - 6} more on the Learning page
              </Link>
            )}
          </Block>

          <Block title={`Deadlines in the next ${DAYS_AHEAD} days`}>
            {deadlines.length === 0 && <Empty>No deadlines.</Empty>}
            <ul className="space-y-1">
              {deadlines.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center gap-x-2 text-sm">
                  <span>{d.label}</span>
                  <CertaintyBadge value={d.certainty} />
                  <span className="text-slate-500">
                    {formatDate(d.end)} · <b>{inDaysText(d.end)}</b>
                  </span>
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Next actions">
            {actions.length === 0 && <Empty>Nothing due in the next {DAYS_AHEAD} days.</Empty>}
            <ul className="space-y-1">
              {actions.map((i) => {
                const overdue = i.nextAction.due && i.nextAction.due < today
                return (
                  <li key={i.id} className="text-sm">
                    <Link to={`/internships/${i.id}`} className="hover:underline">
                      <span className="text-slate-500">
                        {i.company}
                        {i.role && ` (${i.role})`}:{' '}
                      </span>
                      {i.nextAction.text}
                    </Link>
                    {i.nextAction.due && (
                      <span className={`ml-1 text-xs ${overdue ? 'font-medium text-rose-600' : 'text-slate-500'}`}>
                        {overdue ? 'overdue' : 'due'} {formatDate(i.nextAction.due)}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            {laterActions > 0 && (
              <Link to="/internships" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                + {laterActions} due later (sort the Internships table by “Next action”)
              </Link>
            )}
          </Block>
        </div>
      </div>
    </Card>
  )
}
