import { ResourceLink } from '../components/ResourceLink'
import { Card, ProgressBar, TrackTags } from '../components/ui'
import { currentMonth } from '../lib/dates'
import { LEARNING, PROJECTS, PROJECT_RULES, projectResources, trackLabel } from '../seed'
import { useData } from '../state/context'
import { useToggle } from '../state/hooks'

export default function Projects() {
  const { data } = useData()
  const toggle = useToggle()
  const done = new Set(data.projectsDone)
  const month = currentMonth()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Own CV projects</h1>

      <Card tone="note">
        <div className="mb-1 text-sm font-medium">Rules</div>
        <ul className="list-disc space-y-0.5 pl-5 text-sm">
          {PROJECT_RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <div className="mb-2 text-sm font-medium">Projects finished</div>
        <ProgressBar done={PROJECTS.filter((p) => done.has(p.id)).length} total={PROJECTS.length} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {PROJECTS.map((p) => {
          const isDone = done.has(p.id)
          const overdue = !isDone && p.month < month
          // Learning items whose "proof" is this project
          const feeders = LEARNING.filter((i) => i.project === p.id)
          return (
            <Card key={p.id} className="space-y-2">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggle('projectsDone', p.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-emerald-600"
                />
                <span className={`font-medium ${isDone ? 'text-slate-400' : ''}`}>
                  {p.id} · {p.title}
                </span>
              </label>
              <div className="flex flex-wrap items-center gap-2 pl-7 text-xs text-slate-500">
                <span className={overdue ? 'font-medium text-rose-600' : ''}>
                  Target: {p.when}
                  {overdue && ' (overdue)'}
                </span>
                <TrackTags tracks={p.tracks} />
              </div>
              <div className="pl-7 text-sm">
                <span className="text-slate-500">Output: </span>
                {p.output}
              </div>
              {feeders.length > 0 && (
                <ul className="space-y-0.5 pl-7 text-xs text-slate-500">
                  {feeders.map((f) => (
                    <li key={f.id}>
                      ↳ {trackLabel(f.track)} · {f.when}: {f.title}
                    </li>
                  ))}
                </ul>
              )}
              {projectResources(p.id).length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 pl-7 text-xs">
                  <span className="text-slate-500">Resources:</span>
                  {projectResources(p.id).map((id) => (
                    <ResourceLink key={id} id={id} />
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
