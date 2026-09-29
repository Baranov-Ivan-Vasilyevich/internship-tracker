import { hostOf } from '../lib/url'
import type { Source } from '../types'
import { ExternalLink, VerifiedBadge } from './ui'

const KIND_LABEL: Record<Source['kind'], string> = {
  official: 'Official',
  vacancy: 'Vacancy',
  guide: 'Guide (third party)',
  registration: 'Registration',
}

// "Sources" list for an internship, with when each link was last verified
export function SourcesBlock({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return <p className="text-sm text-slate-500">No sources yet.</p>
  return (
    <ul className="space-y-1 text-sm">
      {sources.map((s) => (
        <li key={s.url} className="flex flex-wrap items-center gap-x-2">
          <span className="w-36 shrink-0 text-xs text-slate-500">{KIND_LABEL[s.kind]}</span>
          <ExternalLink href={s.url} className="break-all">
            {hostOf(s.url)}
          </ExternalLink>
          <VerifiedBadge verified={s.verified} />
        </li>
      ))}
    </ul>
  )
}
