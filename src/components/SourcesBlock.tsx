import { hostOf } from '../lib/url'
import type { Source } from '../types'
import { ExternalLink, VerifiedBadge } from './ui'

const KIND_LABEL: Record<Source['kind'], string> = {
  official: 'Official',
  vacancy: 'Vacancy',
  guide: 'Guide (third party)',
  registration: 'Registration',
}

type Props = {
  sources: Source[]
  myVerified?: Record<string, string> // links you confirmed yourself: url → date
  onMark?: (url: string) => void
}

// "Sources" list for an internship, with when each link was last verified
export function SourcesBlock({ sources, myVerified = {}, onMark }: Props) {
  if (sources.length === 0) return <p className="text-sm text-slate-500">No sources yet.</p>
  return (
    <ul className="space-y-2 text-sm">
      {sources.map((s) => {
        const mine = myVerified[s.url]
        // Show whichever check is more recent: the one in the data file, or yours
        const byYou = !!mine && (!s.verified || mine > s.verified)
        const verified = byYou ? mine : s.verified
        return (
          <li key={s.url} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="w-36 shrink-0 text-xs text-slate-500">{KIND_LABEL[s.kind]}</span>
            <ExternalLink href={s.url} className="break-all">
              {hostOf(s.url)}
            </ExternalLink>
            <VerifiedBadge verified={verified} />
            {byYou && <span className="text-[11px] text-slate-400">(by you)</span>}
            {onMark && (
              <button
                onClick={() => onMark(s.url)}
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                aria-label={`Mark ${hostOf(s.url)} as verified today`}
              >
                Mark verified
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
