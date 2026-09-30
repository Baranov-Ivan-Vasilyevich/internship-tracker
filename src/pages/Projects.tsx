import { ResourceLink } from '../components/ResourceLink'
import { Card, ExternalLink, ProgressBar, TrackTags, inputClass } from '../components/ui'
import { currentMonth } from '../lib/dates'
import { LEARNING, PROJECTS, PROJECT_RULES, projectResources, trackLabel } from '../seed'
import { useProjects } from '../state/hooks'
import { PROJECT_STATUSES, type Project, type ProjectState } from '../types'

const STATUS_COLORS: Record<ProjectState['status'], string> = {
  'Not started': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'In progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
}

// The 4-part note from the project rules: question, what I did, result, next step
const NOTE_FIELDS = [
  ['question', 'Question', 'What question does this project answer?'],
  ['whatIDid', 'What I did', 'Data, method, code, with numbers'],
  ['result', 'Result', 'What came out? Numbers, charts, a conclusion'],
  ['nextStep', 'Next step', 'What would you do next?'],
] as const

export default function Projects() {
  const { stateOf, doneCount } = useProjects()

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
        <div className="mb-2 text-sm font-medium">Projects done</div>
        <ProgressBar done={doneCount} total={PROJECTS.length} />
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          {PROJECT_STATUSES.map((s) => (
            <span key={s}>
              {s}: {PROJECTS.filter((p) => stateOf(p.id).status === s).length}
            </span>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {PROJECTS.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  )
}

function ProjectCard({ project: p }: { project: Project }) {
  const { stateOf, update } = useProjects()
  const s = stateOf(p.id)
  const set = (changes: Partial<ProjectState>) => update(p.id, changes)
  const overdue = s.status !== 'Done' && p.month < currentMonth()
  const feeders = LEARNING.filter((i) => i.project === p.id) // learning items whose proof is this project
  const resources = projectResources(p.id)
  const noteFilled = NOTE_FIELDS.filter(([k]) => s[k].trim()).length

  return (
    <Card className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className={`font-medium ${s.status === 'Done' ? 'text-slate-500' : ''}`}>
          {p.id} · {p.title}
        </h2>
        <select
          aria-label={`Status of ${p.id}`}
          value={s.status}
          onChange={(e) => set({ status: e.target.value as ProjectState['status'] })}
          className={`rounded-md border-0 px-2 py-1 text-sm font-medium ${STATUS_COLORS[s.status]}`}
        >
          {PROJECT_STATUSES.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className={overdue ? 'font-medium text-rose-600' : ''}>
          Target: {p.when}
          {overdue && ' (overdue)'}
        </span>
        <TrackTags tracks={p.tracks} />
      </div>
      <div className="text-sm">
        <span className="text-slate-500">Output: </span>
        {p.output}
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-slate-500">GitHub / Kaggle link</span>
        <input
          type="url"
          value={s.url}
          onChange={(e) => set({ url: e.target.value })}
          placeholder="https://github.com/…"
          className={inputClass}
        />
      </label>
      {s.url.startsWith('http') && <ExternalLink href={s.url}>Open project</ExternalLink>}

      <details open={noteFilled > 0}>
        <summary className="cursor-pointer text-sm font-medium">Project note ({noteFilled}/4)</summary>
        <div className="mt-2 space-y-2">
          {NOTE_FIELDS.map(([key, label, placeholder]) => (
            <label key={key} className="flex flex-col gap-1 text-sm">
              <span className="text-slate-500">{label}</span>
              <textarea
                rows={2}
                value={s[key]}
                onChange={(e) => set({ [key]: e.target.value })}
                placeholder={placeholder}
                className={inputClass}
              />
            </label>
          ))}
        </div>
      </details>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={s.selfWritten}
          onChange={(e) => set({ selfWritten: e.target.checked })}
          className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
        />
        I wrote this myself; AI only explained
      </label>
      {s.status === 'Done' && !s.selfWritten && (
        <p className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
          Marked done, but not confirmed as your own work. Tick the box above before you put it on your CV.
        </p>
      )}

      {feeders.length > 0 && (
        <ul className="space-y-0.5 text-xs text-slate-500">
          {feeders.map((f) => (
            <li key={f.id}>
              ↳ {trackLabel(f.track)} · {f.when}: {f.title}
            </li>
          ))}
        </ul>
      )}
      {resources.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <span className="text-slate-500">Resources:</span>
          {resources.map((id) => (
            <ResourceLink key={id} id={id} />
          ))}
        </div>
      )}
    </Card>
  )
}
