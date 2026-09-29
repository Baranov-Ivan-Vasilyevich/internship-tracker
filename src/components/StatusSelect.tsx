import { STATUSES, type Status } from '../types'

const STATUS_COLORS: Record<Status, string> = {
  'Not started': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Preparing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  Applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  Interview: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  Offer: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  Rejected: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
}

export function StatusSelect({
  value,
  onChange,
  label,
}: {
  value: Status
  onChange: (s: Status) => void
  label: string
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as Status)}
      className={`rounded-md border-0 px-2 py-1 text-sm font-medium ${STATUS_COLORS[value]}`}
    >
      {STATUSES.map((s) => (
        <option key={s}>{s}</option>
      ))}
    </select>
  )
}
