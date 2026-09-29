// Small pieces of UI shared by several pages.
import type { ReactNode } from 'react'
import type { Certainty } from '../types'

// tone="note" gives an amber highlight box (rules, tips)
const CARD_TONES = {
  default: 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
  note: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
}

type CardProps = { children: ReactNode; className?: string; tone?: keyof typeof CARD_TONES }

export function Card({ children, className = '', tone = 'default' }: CardProps) {
  return <div className={`rounded-lg border p-4 ${CARD_TONES[tone]} ${className}`}>{children}</div>
}

export function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 text-right text-xs text-slate-500 tabular-nums">
        {done}/{total} · {pct}%
      </span>
    </div>
  )
}

const CERTAINTY_COLORS: Record<Certainty, string> = {
  official: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  expected: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  target: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  approximate: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

export function CertaintyBadge({ value }: { value: Certainty }) {
  return <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${CERTAINTY_COLORS[value]}`}>{value}</span>
}

export function TrackTags({ tracks }: { tracks: string[] }) {
  if (tracks.length === 0) return <span className="text-xs text-slate-400">Other</span>
  return (
    <span className="flex flex-wrap gap-1">
      {tracks.map((t) => (
        <span key={t} className="rounded bg-slate-200 px-1.5 text-xs font-medium dark:bg-slate-700">
          {t}
        </span>
      ))}
    </span>
  )
}

export const buttonClass =
  'rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300'
export const secondaryButtonClass =
  'rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
