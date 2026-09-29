import { resourceById } from '../seed'
import { ExternalLink } from './ui'

// Shows one resource from resources.json by its id: title (as a link if it has one) + type/language/cost
export function ResourceLink({ id, showMeta = false }: { id: string; showMeta?: boolean }) {
  const r = resourceById(id)
  if (!r) return <span className="text-rose-600">Unknown resource “{id}”</span>
  const meta = [r.type, r.lang, r.cost].filter(Boolean).join(' · ')
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1">
      {r.url ? <ExternalLink href={r.url}>{r.title}</ExternalLink> : <span>{r.title}</span>}
      {showMeta && <span className="text-[11px] text-slate-400">({meta})</span>}
    </span>
  )
}
